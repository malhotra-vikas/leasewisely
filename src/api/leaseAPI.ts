import AWS from 'aws-sdk';
import { OpenAIApi, Configuration } from 'openai';
import * as Constants from "../utils/constants"
import { timeStamp } from 'console';
import * as userApi from '../api/user'

// Initialize the DynamoDB client
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = Constants.LEASE_WISELY_USER_LEASES_TABLE // replace 'GolfConversations' with your table name
const openaiKey = process.env.OPENAI_KEY

// Initialize OpenAI client
const configuration = new Configuration({
    apiKey: openaiKey
});


const openai = new OpenAIApi(configuration);

interface ConversationContext {
    email: string;
    Context?: string;
}

export async function getPlayerTypeResponsesForUser(userEmail: string) {
    let playerTypeResponses = null
    const fetchedUser = await userApi.retrieveUserByEmail(userEmail)
    console.log("in getPlayerTypeResponsesForUser fetchedUser is" + JSON.stringify(fetchedUser))

    if (!fetchedUser || fetchedUser.length === 0) {
        console.error("No user found or no data available for user:", userEmail);
        return "No data available.";
    }

    const userItem = fetchedUser[0];
    let playerTypeString = ''


    for (const key in userItem) {
        if (userItem.hasOwnProperty(key)) {
            playerTypeString += `${key} is ${userItem[key]}\n`; // Append each key-value pair with a newline for better readability
        }
    }
    console.log(playerTypeString);
    return playerTypeString.trim(); // Trim the last newline character to clean up the final string
}


export async function getUserLeaseContext(email: string, leaseUuid: string) {
    console.log("Searching for email in user Context Conversations" + email)
    try {
        // Define the DynamoDB query parameters
        const params: AWS.DynamoDB.DocumentClient.QueryInput = {
            TableName: Constants.LEASE_WISELY_USER_LEASES_TABLE,
            KeyConditionExpression: '',
            ExpressionAttributeNames: {},
            ExpressionAttributeValues: {},
        }

        // Check if partition key is provided and add it to the query
        if (email) {
            if (params.ExpressionAttributeNames) {
                // Use params.ExpressionAttributeNames safely here
                params.ExpressionAttributeNames['#partitionKey'] = "email"
                params.ExpressionAttributeNames['#sortKey'] = "uuid"
            }
            if (params.ExpressionAttributeValues) {
                // Use params.ExpressionAttributeValues safely here
                params.ExpressionAttributeValues[':partitionValue'] = email
                params.ExpressionAttributeValues[':sortValue'] = leaseUuid

            }
            params.KeyConditionExpression += '#partitionKey = :partitionValue'
            params.KeyConditionExpression += ' AND #sortKey = :sortValue'
        }

        let items = ''
        let leaseContext = null
        console.log("Searching for params " + JSON.stringify(params))

        // Perform the query on the DynamoDB table
        const result = await dynamodb.query(params).promise()
        if (result && result.Items) {
            let resultJson = JSON.stringify(result)
            leaseContext = extractContexts(resultJson)
        }

        return leaseContext

    } catch (error) {
        console.log("Error  " + error)

        throw error
    }


}

// Function to parse JSON and extract Context field
function extractContexts(jsonData: string): string[] {
    console.log(" in extractContexts jsonData is ", jsonData)

    // Parse the JSON data
    const data = JSON.parse(jsonData).Items as LeaseItem[];
    console.log(" in extractContexts data is ", data);

    // Map over the parsed data to extract the Context field
    const contexts = data.map((item: LeaseItem) => item.leaseText);
    console.log(" in extractContexts contexts is ", contexts);

    return contexts;
}

export async function saveUserContext(email: string, question: string, response: string): Promise<void> {
    // Create a JSON object from the question and response
    const context = JSON.stringify({
        question: question,
        response: response
    });

    const params = {
        TableName: tableName,
        Item: {
            email: email,
            Context: context,
            timestamp: new Date().toISOString()
        }
    };
    try {
        await dynamodb.put(params).promise();
    } catch (error) {
        console.error("Error saving user context:", error);
    }
}

export async function askOpenAI(question: string, context: string) {
    console.log("in askOpenAI - Question is ", question)
    console.log("in askOpenAI - Context is ", context)

    let openAIResponse = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'content-type': 'application/json'
        },
        isBase64Encoded: false,
        body: ''
    }

    // Build the effective prompt by integrating historical context and player type responses
    let effectivePrompt = "LeaseText:"
    let engineeredPrompt = `Help me find answer to this question. If the question is about a date give a factual date in the response: ${question} in this lease: `
    const model = "gpt-4o-mini"

    try {
        const contextArray = JSON.parse(context);
        if (Array.isArray(contextArray) && contextArray.length > 0) {
            // Join the context array into a string if it's not empty, and prepend to the question
            effectivePrompt = effectivePrompt + `${contextArray.join("\n")}\n\n`;
        }
        engineeredPrompt = engineeredPrompt + effectivePrompt
        //effectivePrompt = effectivePrompt + `\n\nHelp me find answer to this question: `;
        //effectivePrompt = effectivePrompt + `${question}`
    } catch (error) {
        console.error("Error parsing context, using question only:", error);
        // If parsing fails, use only the question
        //effectivePrompt = question;
        engineeredPrompt = question
    }

    console.log(`Model i: ${model} in this lease: `)
    console.log("in askOpenAI - Engineered Prompt is ", engineeredPrompt)

    // Correct type annotation for chatMessages
    let chatMessages: { role: 'system' | 'user', content: string }[] = [{
        role: "system",
        content: "You are a Residential Lease Expert. You are designed to give great answers to people's questions about their Leases. \
        You apply context for the lease using LeaseText and you also use past responses while gicing answers. \
        If the user's question is about a date, you are very specific and factual response."
    }];
    chatMessages.push({ role: 'user', content: engineeredPrompt });

    try {
        if (model) {
            const response = await openai.createChatCompletion({
                model: model, // Ensure this model is available or update as necessary
                messages: chatMessages,
                max_tokens: 1000
            });

            console.log("in askOpenAI -Building Rresponse ", response)

            // Check if the choices array and the text are not undefined
            if (response && response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content) {
                openAIResponse.body = response.data.choices[0].message.content.trim();
                openAIResponse.statusCode = response.status
            } else {
                throw new Error("No completion found or completion was empty.");
            }

        }
        return openAIResponse


    } catch (error: any) {
        console.error("Error in askOpenAI:", error);

        if (error.response) {
            console.error("HTTP status code:", error.response.status);
            console.error("Response body:", error.response.data);

            switch (error.response.status) {
                case 429:
                    console.error("Rate limit exceeded");
                    break;
                case 503:
                    console.error("Service unavailable");
                    break;
                default:
                    console.error("Unhandled error status:", error.response.status);
            }

            openAIResponse.body = JSON.stringify(error.response.data);
            openAIResponse.statusCode = error.response.status;
        } else {
            openAIResponse.body = JSON.stringify({ error: error.message });
            openAIResponse.statusCode = 500;
        }
    }
}




export async function handleConversation(email: string, leaseUuid: string, userInput: string) {
    let conversationResponse = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'content-type': 'application/json'
        },
        isBase64Encoded: false,
        body: ''
    }

    // string[] with context
    let context = await getUserLeaseContext(email, leaseUuid);
    if (!context) {
        context = []
    }
    const jsonContext = JSON.stringify(context)

    try {
        console.log("In Handle Conversations - Context " + jsonContext)

        const cconversationResponse = await askOpenAI(userInput, jsonContext);
        console.log("In Handle Conversations - AI REsponse " + JSON.stringify(cconversationResponse))

        //        await saveUserQuestions(email, leaseUuid, userInput, conversationResponse);
        return JSON.stringify(cconversationResponse);

    } catch (error) {
        console.error("Failed to process the AI response:", error);
    }
    return ''
}

