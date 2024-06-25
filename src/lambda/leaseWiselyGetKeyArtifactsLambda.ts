import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as Constants from '../utils/constants';

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";


import AWS = require('aws-sdk')

AWS.config.update({ region: Constants.AWS_REGION })

// Initialize DynamoDB Document Client
// Create DynamoDB client
const client = new DynamoDBClient({ region: Constants.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const dynamoDB = new AWS.DynamoDB.DocumentClient()

interface RequestBody {
    email: string;
    uuid: string;
}


export async function getKeyArtifactsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    console.log("Lease Wisely - Event Starting");

    let response: APIGatewayProxyResult = {
        statusCode: 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        isBase64Encoded: false,
        body: JSON.stringify({ error: "Internal Server Error" })
    };

    try {

        // Extract user details from the path parameters.
        const email = event.queryStringParameters?.email

        // Extract user details from the path parameters.
        const uuid = event.queryStringParameters?.uuid

        if (!email) {
            response.statusCode = 400;
            response.body = JSON.stringify({ error: "Validation Error - email is missing" });
            return response;
        }
        console.log("Email and UUID", email, uuid);

        // Fetch data from DynamoDB
        const params = {
            TableName: Constants.LEASE_WISELY_USER_LEASES_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };
        console.log("params", params);
        console.log("dynamoDB", dynamoDB);
        let leaseCount = 0;

        const data = await ddbDocClient.send(new QueryCommand(params));
        if (data && data.Items && data.Items.length > 0) {
            leaseCount = data.Items.length
            const userLeaseData = data.Items.map(item => {
                return {
                    email: email,
                    uuid: item.uuid,
                    keyArtifacts: item.keyArtifacts || "NA",
                    leasePropertyAddress: item.propertyAddress || "NA",
                    leaseStartDate: item.leaseStartDate || "NA",
                    leaseDataAvailable: item.leaseDataAvailable || "NA"
                };
            });
            
            response.statusCode = 200;
            response.body = JSON.stringify({
                "lease-count": leaseCount,
                "user-lease": userLeaseData
            });
        
            response.body = JSON.stringify({ "user-lease": userLeaseData });        
        } else {
            response.statusCode = 200;
            response.body = JSON.stringify({
                "lease-count": leaseCount,
                "user-lease": "No Leases found for this email"
            });
        }
        return response;
    } catch (error: unknown) {
        console.log("Error processing request:", error);
        response.statusCode = 500;
        response.body = JSON.stringify({
            error: "Internal Server Error",
            details: parseError(error)
        })
        return response;
    }

    console.log("Response from Lambda", JSON.stringify(response));
    return response;
}


// Helper function to parse unknown error
function parseError(error: unknown): string {
    if (error instanceof Error) {
        // If error is an instance of Error, return its message and stack trace
        return `${error.message}\n${error.stack}`;
    } else if (typeof error === 'string') {
        // If error is a string, return it directly
        return error;
    } else {
        // Fallback for any other type of error
        return JSON.stringify(error);
    }
}
