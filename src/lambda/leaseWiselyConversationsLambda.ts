import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as Constants from '../utils/constants';
import * as leaseAPI from '../api/leaseAPI';
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { open } from 'fs/promises';

// Initialize AWS DynamoDB DocumentClient
const dynamoDB = new DynamoDBClient({ region: Constants.AWS_REGION });

export async function leaseConversationsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log("Event Starting");

  // Initialize response with a default error state
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
    // Extract query parameters from the event object for GET request
    const userEmail = event.queryStringParameters?.userEmail;
    const leaseUuid = event.queryStringParameters?.leaseUuid;
    const userQuery = event.queryStringParameters?.userQuery;

    console.log("Extracted Query Parameters", { userEmail, leaseUuid, userQuery });

    if (!userEmail || !leaseUuid || !userQuery) {
      response.statusCode = 400;
      response.body = JSON.stringify({ error: "Validation Error - Search Criteria Missing" });
      return response;
    }

    // Call the leaseAPI and update the response accordingly
    const apiResponse = await leaseAPI.handleConversation(userEmail, leaseUuid, userQuery);
    const apiResponseJSON = JSON.parse(apiResponse)
    if (apiResponseJSON.statusCode === 200) {
      console.log("Lease Parsed and Stored", JSON.stringify(apiResponseJSON.body));
      response.statusCode = 200;
      response.body = JSON.stringify(apiResponseJSON.body, null, 2);
    } else {
      response.statusCode = apiResponseJSON.statusCode;
      response.body = JSON.stringify(apiResponseJSON.body);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    // Maintain error state set during initialization
  }

  console.log("Response from create Lambda", JSON.stringify(response));
  return response;
}
