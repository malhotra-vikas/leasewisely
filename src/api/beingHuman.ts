import AWS from 'aws-sdk';
import { OpenAIApi, Configuration } from 'openai';
import * as Constants from "../utils/constants"
import { timeStamp } from 'console';
import * as userApi from '../api/user'
import { getBallBrands } from '../utils/awsUtils'
import { GetItemInput } from 'aws-sdk/clients/dynamodb';

// Initialize the DynamoDB client
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = 'GolfProUsersConversations'; // replace 'GolfConversations' with your table name
const recommendationTable = 'GolfProUsersRecommendations'

// Initialize OpenAI client
const configuration = new Configuration({
    apiKey: 'sk-proj-hCXHodFKtiVHAcwsP2kKT3BlbkFJOxyLbC6XOxs2wbFUoEtQ' // replace 'your-openai-api-key' with your actual OpenAI API key
});

const openai = new OpenAIApi(configuration);

const responseJSON = [
    {
        "brand": "",
        "model": "",
        "percentageMatch": "",
        "driverDistance": "",
        "driverHeight": "",
        "driverWindScore": "",
        "ironCarry": "",
        "ironRoll": "",
        "greensideSpin": "",
        "putterFeel": ""
    },
    {
        "brand": "",
        "model": "",
        "percentageMatch": "",
        "driverDistance": "",
        "driverHeight": "",
        "driverWindScore": "",
        "ironCarry": "",
        "ironRoll": "",
        "greensideSpin": "",
        "putterFeel": ""
    },
    {
        "brand": "",
        "model": "",
        "percentageMatch": "",
        "driverDistance": "",
        "driverHeight": "",
        "driverWindScore": "",
        "ironCarry": "",
        "ironRoll": "",
        "greensideSpin": "",
        "putterFeel": ""
    },
    {
        "brand": "",
        "model": "",
        "percentageMatch": "",
        "driverDistance": "",
        "driverHeight": "",
        "driverWindScore": "",
        "ironCarry": "",
        "ironRoll": "",
        "greensideSpin": "",
        "putterFeel": ""
    },
    {
        "brand": "",
        "model": "",
        "percentageMatch": "",
        "driverDistance": "",
        "driverHeight": "",
        "driverWindScore": "",
        "ironCarry": "",
        "ironRoll": "",
        "greensideSpin": "",
        "putterFeel": ""
    }
]

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
        return null;
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

export async function getUserContext(email: string) {
    console.log("Searching for email in user Context Conversations" + email)
    try {
        // Define the DynamoDB query parameters
        const params: AWS.DynamoDB.DocumentClient.QueryInput = {
            TableName: Constants.GOLF_PRO_USERS_CONVERSATIONS_TABLE,
            KeyConditionExpression: '',
            ExpressionAttributeNames: {},
            ExpressionAttributeValues: {},
        }

        // Check if partition key is provided and add it to the query
        if (email) {
            if (params.ExpressionAttributeNames) {
                // Use params.ExpressionAttributeNames safely here
                params.ExpressionAttributeNames['#partitionKey'] = Constants.GOLF_PRO_USERS_TABLE_PARTITION_KEY

            }
            if (params.ExpressionAttributeValues) {
                // Use params.ExpressionAttributeValues safely here
                params.ExpressionAttributeValues[':partitionValue'] = email
            }
            params.KeyConditionExpression += '#partitionKey = :partitionValue'
        }

        let items = ''
        let context = null
        console.log("Searching for params " + JSON.stringify(params))

        // Perform the query on the DynamoDB table
        const result = await dynamodb.query(params).promise()
        if (result && result.Items) {
            let resultJson = JSON.stringify(result)
            context = extractContexts(resultJson)
        }

        return context

    } catch (error) {
        console.log("Error  " + error)

        throw error
    }


}

// Function to parse JSON and extract Context field
function extractContexts(jsonData: string): string[] {
    console.log(" in extractContexts jsonData is ", jsonData)

    // Parse the JSON data
    const data = JSON.parse(jsonData).Items as Item[];
    console.log(" in extractContexts data is ", data);

    // Map over the parsed data to extract the Context field
    const contexts = data.map((item: Item) => item.Context);
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

interface UpdateRecommendationParams {
    TableName: string;
    Key: {
        email: string;
        recommendationStatus: string
    };
    UpdateExpression: string;
    ExpressionAttributeValues: {
        [key: string]: string;
    };
    ExpressionAttributeNames: {}
    ReturnValues: string;
}



export async function saveRecommendations(email: string, recommendation: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString(); // Current timestamp in seconds as a string
    let recommendationStatus = "current"

    const params: UpdateRecommendationParams = {
        TableName: recommendationTable,
        Key: {
            email: email,
            recommendationStatus: recommendationStatus
        },
        UpdateExpression: 'SET recommendation = :newRec, #timestampAttr = :timestampVal',

        ExpressionAttributeValues: {
            ':newRec': recommendation,
            ':timestampVal': timestamp
        },
        ExpressionAttributeNames: {
            '#timestampAttr': 'timestamp',
        },

        ReturnValues: 'UPDATED_NEW'
    };

    try {
        const result = await dynamodb.update(params).promise();
        return result;

    } catch (error) {
        console.error('DynamoDB Error', error);
        throw error;
    }

}

export async function makeFavorite(email: string, favorite: string) {
    const recommendationStatus = "current"
    console.debug("Saving for", favorite)
    const params: UpdateRecommendationParams = {
        TableName: recommendationTable,
        Key: {
            email: email,
            recommendationStatus: recommendationStatus
        },
        UpdateExpression: 'SET #favorite = :favorite',
        ExpressionAttributeValues: {
            ':favorite': favorite
        },
        ExpressionAttributeNames: {
            '#favorite': 'favorite',
        },
        ReturnValues: 'UPDATED_NEW'
    };

    try {
        const result = await dynamodb.update(params).promise();
        console.debug("result", result)
        return result

    } catch (error) {
        console.error('DynamoDB Error', error);
        throw error;
    }

}

export async function askOpenAIRecommendations(playerTypeResponses: string): Promise<string> {
    console.log("in askOpenAIRecommendations - playerTypeResponses is ", playerTypeResponses)

    let ballRecommendationCategories = "Brand Name, Model Name, Percentage match to Player Preferences, Driver Distance, Driver Height, Driver Wind Score, 7-Iron Carry, 7-Iron Roll, Greenside Spin and Putter Feel"

    // Build the effective prompt by integrating historical context and player type responses
    let effectivePrompt = `Player Game Preferences:${playerTypeResponses}\n\nBall Recommendation Categories:${ballRecommendationCategories}\n\nResponse Format:${JSON.stringify(responseJSON)}`;

    console.log("in askOpenAI - Effective Prompt is ", effectivePrompt)
    // Correct type annotation for chatMessages
    let chatMessages: { role: 'system' | 'user', content: string }[] = [{
        role: "system",
        content: "You are an expert Golf Ball Fitting assistant designed to make recommendations for Golf Ball Fittings. You make 5 Golf Ball Brand and Model recommendations. The recommendations has a row for each of the categories defined in Ball Recommendation Categories. The response format will follow Response Format schema. You give high weightage to Player Game Preferences while making recommendations."
    }];
    chatMessages.push({ role: 'user', content: effectivePrompt });

    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo", // Ensure this model is available or update as necessary
            messages: chatMessages,
            max_tokens: 1000
        });

        console.log("in askOpenAI -Building Rresponse ", response)

        if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message && response.data.choices[0].message.content) {
            // Extracting the golf ball recommendations from the response
            let golfBallRecommendations = ''
            golfBallRecommendations = response.data.choices[0].message.content.trim();
            console.log("Response from golfBallRecommendations Lambda", golfBallRecommendations);

            return golfBallRecommendations;

        } else {
            console.error("No golf ball recommendations found in the response.");
            return "No recommendations found.";
        }

        /*
                // Check if the choices array and the text are not undefined
                if (response && response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content) {
                    return  JSON.stringify(response.data.choices[0].message.content.trim());
                } else {
                    throw new Error("No completion found or completion was empty.");
                }
        */
    } catch (error: any) {
        console.error("Error in askOpenAI:", error);
        if (error.response) {
            console.error("HTTP status code:", error.response.status);
            console.error("Response body:", error.response.data);
            // Handle specific cases based on status code
            switch (error.response.status) {
                case 429:
                    console.error("Rate limit exceeded");
                    break;
                case 503:
                    console.error("Service unavailable");
                    break;
                // Add more cases as needed
            }
        }
        throw new Error("Failed to get response from OpenAI");
    }
}

export async function askOpenAI(question: string, context: string, playerTypeResponses: string, ballBrands: BallBrand[]): Promise<string> {
    console.log("in askOpenAI - Question is ", question)
    console.log("in askOpenAI - Context is ", context)
    console.log("in askOpenAI - playerTypeResponses is ", playerTypeResponses)

    // Build the effective prompt by integrating historical context and player type responses
    let effectivePrompt = "Context:"

    try {
        const contextArray = JSON.parse(context);
        if (Array.isArray(contextArray) && contextArray.length > 0) {
            // Join the context array into a string if it's not empty, and prepend to the question
            effectivePrompt = effectivePrompt + `${contextArray.join("\n")}\n\n`;
        }
        if (Array.isArray(ballBrands) && ballBrands.length > 0) {
            // Join the context array into a string if it's not empty, and prepend to the question
            effectivePrompt = effectivePrompt + `Ball Brands:${ballBrands.join("\n")}\n\n`;
        }

        effectivePrompt = effectivePrompt + `Player Game Preferences:${playerTypeResponses}\n\nQuestion: `;
        effectivePrompt = effectivePrompt + `${question}`
    } catch (error) {
        console.error("Error parsing context, using question only:", error);
        // If parsing fails, use only the question
        effectivePrompt = question;
    }

    console.log("in askOpenAI - Effective Prompt is ", effectivePrompt)
    // Correct type annotation for chatMessages
    let chatMessages: { role: 'system' | 'user', content: string }[] = [{
        role: "system",
        content: "You are a helpful Golf Ball Fitting assistant designed to give great recommendations to people's questions about Golf and Ball Fittings. You apply context on people's past questions using Context and you also give high weightage to Player Game Preferences while making recommendations. You focus your recomnmendation around the Ball Brands included in the query"
    }];
    chatMessages.push({ role: 'user', content: effectivePrompt });

    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo", // Ensure this model is available or update as necessary
            messages: chatMessages,
            max_tokens: 1000
        });

        console.log("in askOpenAI -Building Rresponse ", response)

        // Check if the choices array and the text are not undefined
        if (response && response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content) {
            return response.data.choices[0].message.content.trim();
        } else {
            throw new Error("No completion found or completion was empty.");
        }
    } catch (error: any) {
        console.error("Error in askOpenAI:", error);
        if (error.response) {
            console.error("HTTP status code:", error.response.status);
            console.error("Response body:", error.response.data);
            // Handle specific cases based on status code
            switch (error.response.status) {
                case 429:
                    console.error("Rate limit exceeded");
                    break;
                case 503:
                    console.error("Service unavailable");
                    break;
                // Add more cases as needed
            }
        }
        throw new Error("Failed to get response from OpenAI");
    }
}

export async function makeRecomemndations(email: string): Promise<string> {
    let response = ''

    // Check if this user has an existing recomemndation that is current. Return that.
    let existingCurrentRecommendation = await getCurrentRecommendationForUser(email)
    if (existingCurrentRecommendation && existingCurrentRecommendation.length > 0) {
        // Accessing the first recommendation in the array (assuming there's only one)
        const firstRecommendation = existingCurrentRecommendation[0];

        console.log("Found existing", firstRecommendation)
        response = firstRecommendation.recommendation 
        console.log("Found existing - Response Returned", response)

        return response
    }


    let playerTypeResponses = await getPlayerTypeResponsesForUser(email)
    if (!playerTypeResponses) {
        return ''
    }
    console.log("In Handle Conversations - playerTypeResponses " + playerTypeResponses)

    try {
        response = await askOpenAIRecommendations(playerTypeResponses);
        console.log("In Handle Conversations - AI REsponse " + response)

        await saveRecommendations(email, response);

    } catch (error) {
        console.error("Failed to process the AI response:", error);
    }
    return response;
}

export async function handleConversation(email: string, userInput: string): Promise<string> {
    // string[] with context
    let context = await getUserContext(email);
    if (!context) {
        context = []
    }
    let response;
    const jsonContext = JSON.stringify(context)

    // string[] with context
    let ballBrands = await getBallBrands();
    if (!ballBrands) {
        ballBrands = []
    }
    const jsonballBrands = JSON.stringify(ballBrands)


    let playerTypeResponses = await getPlayerTypeResponsesForUser(email)
    if (!playerTypeResponses) {
        playerTypeResponses = ''
    }
    console.log("In Handle Conversations - playerTypeResponses " + playerTypeResponses)

    try {
        console.log("In Handle Conversations - Context " + jsonContext)

        response = await askOpenAI(userInput, jsonContext, playerTypeResponses, ballBrands);
        console.log("In Handle Conversations - AI REsponse " + response)

        await saveUserContext(email, userInput, response);
        return response;

    } catch (error) {
        console.error("Failed to process the AI response:", error);
    }
    return ''
}

export async function getCurrentRecommendationForUser(email: string) {

    let recommendationStatus = "current"

    console.log("Searching for email" + email)
    try {
        // Define the DynamoDB query parameters
        const params: AWS.DynamoDB.DocumentClient.QueryInput = {
            TableName: Constants.GOLF_PRO_USERS_RECOMMENDATIONS_TABLE,
            KeyConditionExpression: '#partitionKey = :partitionValue AND #sortKey = :sortValue',
            ExpressionAttributeNames: {
                '#partitionKey': "email",
                '#sortKey': "recommendationStatus"
            },
            ExpressionAttributeValues: {
                ':partitionValue': email,
                ':sortValue': recommendationStatus
            }
        };


        let items
        console.log("Searching for params " + JSON.stringify(params))

        // Perform the query on the DynamoDB table
        const result = await dynamodb.query(params).promise()

        console.log("Items found " + JSON.stringify(result))
        items = result.Items || null

        return items

    } catch (error) {
        console.log("Error  " + error)

        throw error
    }

}

