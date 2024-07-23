import { SNSHandler, SNSEvent, Context, Callback } from 'aws-lambda';
import AWS from 'aws-sdk';
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import * as Constants from '../utils/constants';
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const snsClient = new SNSClient({ region: Constants.AWS_REGION });

// Initialize the SQS client
const sqsClient = new SQSClient({ region: "us-east-2" });

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

interface SNSMessage {
    uuid: string;
    email: string;
}

export const buildTextHandler: SNSHandler = async (event: SNSEvent, context: Context, callback: Callback): Promise<void> => {
    console.log("SNS Event Received: ", JSON.stringify(event));

    const newLeasesTable = process.env.LEASEWISELY_NEWLEASE_DYNAMODB_TABLE_NAME;
    const userLeasesTable = process.env.LEASEWISELY_USERLEASE_DYNAMODB_TABLE_NAME;
    const sqsQueueUrl = process.env.LEASEWISELY_SQS_QUEUE_URL; // Add SQS queue URL as an environment variable

    if (!newLeasesTable || !userLeasesTable) {
        console.error("Environment variables for DynamoDB table names are not set.");
        return;
    }

    try {
        for (const record of event.Records) {
            const snsMessage: SNSMessage = JSON.parse(record.Sns.Message);
            const { uuid, email } = snsMessage;

            console.log(`Processed SNS Message - UUID: ${uuid}, Email: ${email}`);
            try {

                // Insert extracted text into another DynamoDB table
                await dynamoDb.put({
                    TableName: userLeasesTable,
                    Item: {
                        email,
                        uuid: uuid
                    }
                }).promise();

                console.log(`Inserted data into destination table for UUID: ${uuid}, Email: ${email}`);

                const message = JSON.stringify({
                    uuid,
                    email
                });

                const topicArn = process.env.LEASE_WISELY_PDF_READY_TO_PARSE_SNS_TOPIC_ARN;
                if (!topicArn) {
                    throw new Error("SNS topic ARN is not configured.");
                }

                const params = {
                    Message: message,
                    TopicArn: topicArn,
                };

                const data = await snsClient.send(new PublishCommand(params));
                console.log(`Message sent to SNS topic ${topicArn}. MessageID: ${data.MessageId}. Message Params are ${params}`);

                // Send message to SQS queue
                const sqsParams = {
                    MessageBody: message,
                    QueueUrl: sqsQueueUrl,
                    MessageGroupId: 'PDFParser' // This is required for FIFO queues
                };
                console.log(`Trying to send Message queue ${sqsQueueUrl}. Message Params are ${JSON.stringify(sqsParams)}`);

                // Send message to SQS queue
                const sqsData = await sqsClient.send(new SendMessageCommand(sqsParams));
                console.log(`Message sent to SQS queue ${sqsQueueUrl}. Message Params are ${JSON.stringify(sqsParams)}`);


            } catch (textractError) {
                console.error("Textract error:", textractError);
                if (isTextractError(textractError)) {
                    if (textractError.code === 'UnsupportedDocumentException') {
                        console.error("Document format is not supported by Textract.");
                    }
                } else {
                    console.error("An unexpected error occurred:", textractError);
                }
            }
        }
    } catch (error) {
        console.error("Error processing SNS event: ", error);

    }

    // Type guard to check if error is a TextractError
    function isTextractError(error: unknown): error is AWS.AWSError {
        return typeof error === 'object' && error !== null && 'code' in error;
    }

    // Function to validate PDF format
    function isValidPDFFormat(documentBytes: Buffer): boolean {
        return documentBytes.slice(0, 4).toString() === '%PDF';
    }

};
