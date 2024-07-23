import { Construct } from 'constructs'

import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as cdk from 'aws-cdk-lib'
import * as Constants from '../src/utils/constants'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'

import * as sns from 'aws-cdk-lib/aws-sns'
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions'
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';  // Correct import for SQS in CDK v2
import * as path from 'path';

import 'dotenv/config';

const applicationId = Constants.PINPOINT_CONTACT_COMMUNICATIONS_APPLICATION

export class LeasewiselyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Define the SQS queue
    const queue = new sqs.Queue(this, 'Ready-For-PDFToText', {
      queueName: 'Ready-For-PDFToText',
      visibilityTimeout: cdk.Duration.seconds(300)
    })

    const snsLoggingRole = new iam.Role(this, 'SnsLoggingRole', {
      assumedBy: new iam.ServicePrincipal('sns.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
    })

    const leaseWiselyLayer = new lambda.LayerVersion(this, 'LeaseWiselyLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../leasewisely-layer')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'A layer that includes the UUID module',
    });

    // Define the SNS Publish Policy
    const snsPublishPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sns:Publish'],
      resources: ['*'], // It's better to specify the exact ARN of the SNS topic if possible
    })

    // Create SNS Topic for AdminAlerts
    const snsTopicLeaseWiselyUserRegisteration = new sns.Topic(this, 'LeaseWisely-NewRegistration-SNSTopic', {
      displayName: 'LeaseWisely-NewRegistration-SNSTopic',
      topicName: 'LeaseWisely-NewRegistration-SNSTopic' // Explicit physical name
    })

    // Create SNS Topic for AdminAlerts
    const snsTopicLeaseWiselyPDFReadyToParse = new sns.Topic(this, 'LeaseWisely-NewPDFReadyToParse-SNSTopic', {
      displayName: 'LeaseWisely-PDFReadyToParse-SNSTopic',
      topicName: 'LeaseWisely-PDFReadyToParse-SNSTopic' // Explicit physical name
    })

    // Create SNS Topic for AdminAlerts
    const snsTopicAdminAlerts = new sns.Topic(this, 'GolfProAI-ContactSNSTopic-AdminAlerts', {
      displayName: 'GolfProAI-ContactSNSTopic-AdminAlerts',
      topicName: 'GolfProAI-ContactSNSTopic-AdminAlerts' // Explicit physical name
    })

    // Create SNS Topic for ContactVerification
    const snsTopicContactVerification = new sns.Topic(this, 'GolfProAI-ContactSNSTopic-ContactVerification', {
      displayName: 'GolfProAI-ContactSNSTopic-ContactVerification',
      topicName: 'GolfProAI-ContactSNSTopic-ContactVerification'
    })


    // Define DynamoDB table for contacts
    const golfProBrandsTable = new dynamodb.Table(this, Constants.GOLF_PRO_BRANDS_TABLE, {
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      tableName: Constants.GOLF_PRO_BRANDS_TABLE,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use On-Demand billing mode
    })

    // Define DynamoDB table for contacts
    const golfProAIUserConversationsTable = new dynamodb.Table(this, 'GolfProAIUsersConversationsTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      tableName: Constants.GOLF_PRO_USERS_CONVERSATIONS_TABLE,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use On-Demand billing mode
    })
    // Adding a Global Secondary Index (GSI) for 'managerId'
    golfProAIUserConversationsTable.addGlobalSecondaryIndex({
      indexName: Constants.GOLF_PRO_CONVERSATIONS_TABLE_TIMESTAMP_IDX, // If you have a custom index for name
      partitionKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      // You can include 'name' and 'email' as non-key attributes if you need to return these attributes in your query results
    });

    // Define DynamoDB table for contacts
    const golfProAIUserRecommendationsTable = new dynamodb.Table(this, 'GolfProAIUsersRecommendationsTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'recommendationStatus', type: dynamodb.AttributeType.STRING },
      tableName: Constants.GOLF_PRO_USERS_RECOMMENDATIONS_TABLE,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use On-Demand billing mode
    })

    // Define DynamoDB table for contacts
    const leaseWiselyNewLeaseTable = new dynamodb.Table(this, Constants.LEASE_WISELY_NEW_LEASES_TABLE, {
      partitionKey: { name: 'uuid', type: dynamodb.AttributeType.STRING },      
      tableName: Constants.LEASE_WISELY_NEW_LEASES_TABLE,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use On-Demand billing mode
    })


        // Define DynamoDB table for contacts
        const leaseWiselyUserLeaseMappingTable = new dynamodb.Table(this, Constants.LEASE_WISELY_USER_LEASE_MAPPING_TABLE, {
          partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
          tableName: Constants.LEASE_WISELY_USER_LEASE_MAPPING_TABLE,
          billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use On-Demand billing mode
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        })

        
    // Define DynamoDB table for contacts
    const leaseWiselyUserLeaseTable = new dynamodb.Table(this, Constants.LEASE_WISELY_USER_LEASES_TABLE, {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: {
        name: 'uuid',
        type: dynamodb.AttributeType.STRING
    },
      tableName: Constants.LEASE_WISELY_USER_LEASES_TABLE,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use On-Demand billing mode
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Define DynamoDB table for contacts
    const golfProAIUserTable = new dynamodb.Table(this, 'GolfProAIUsersTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      tableName: Constants.GOLF_PRO_USERS_TABLE,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use On-Demand billing mode
    })
    // Adding a Global Secondary Index (GSI) for 'managerId'
    golfProAIUserTable.addGlobalSecondaryIndex({
      indexName: Constants.GOLF_PRO_USERS_TABLE_NAME_IDX, // If you have a custom index for name
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      // You can include 'name' and 'email' as non-key attributes if you need to return these attributes in your query results
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['name', 'email']
    });

    // Create IAM Role
    const lambdaRole = new iam.Role(this, Constants.LAMBDA_ROLE, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: Constants.LAMBDA_ROLE,
      description: 'Role for Lambda with logging, DynamoDB and SNS permissions',
    })

    // Attach policies to the role

    // CloudWatch logs policy
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:*:*:*'],
    }))



    // Grant Textract permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['textract:AnalyzeDocument'],
      resources: ['*'],
    }))

    // DynamoDB read/write policy
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem', 'dynamodb:Scan', 'dynamodb:Query'],
      resources: [Constants.GOLF_PRO_USERS_TABLE_ARN], // Replace with your DynamoDB table ARN
    }))

    // SNS publish policy
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: ['*'], // Replace with your SNS topic ARN
    }))

    // S3 read/write policy
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:ListBucket', 's3:PutObject', 's3:PutObjectAcl'],
      resources: ['arn:aws:s3:::bulk-upload-contacts/*', 'arn:aws:s3:::bulk-upload-contacts', 'arn:aws:s3:::leasewisely-newleases/*']
    }))


    // Create Lambda function for creating contacts
    const conversationLambda = new lambdaNodejs.NodejsFunction(this, Constants.GOLF_PRO_CONVERSATION_LAMBDA, {
      entry: 'src/lambda/conversations.ts', // Path to your Lambda code
      handler: 'conversationsHandler', // The exported function name for creating contacts
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        TABLE_NAME: golfProAIUserTable.tableName,
      },
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      functionName: Constants.GOLF_PRO_CONVERSATION_LAMBDA
    })

    // Load environment variables from .env file
    if (!process.env.OPENAI_API_KEY_HOMEY_BOT_KEY) {
      throw new Error('OPENAI_API_KEY_HOMEY_BOT_KEY is not defined in the environment variables');
    }
    const open_ai_homey_key = process.env.OPENAI_API_KEY_HOMEY_BOT_KEY;

    const leaseWiselyNewUserRegistrationLambda = new lambdaNodejs.NodejsFunction(this, Constants.LEASE_WISELY_NEW_USER_REGISTERATION_LAMBDA, {
      entry: 'src/lambda/leaseWiselyUserResisteredLambda.ts', // Path to your Lambda code
      handler: 'userRegisteredHandler', // The exported function name for creating contacts
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        TABLE_NAME: leaseWiselyUserLeaseTable.tableName,
        OPENAI_KEY: open_ai_homey_key,
        LEASE_WISELY_SNS_TOPIC_ARN: snsTopicLeaseWiselyUserRegisteration.topicArn
      },
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      functionName: Constants.LEASE_WISELY_NEW_USER_REGISTERATION_LAMBDA,
      layers: [leaseWiselyLayer]
    })

    snsTopicLeaseWiselyUserRegisteration.grantPublish(leaseWiselyNewUserRegistrationLambda)

    const leaseWiselyGetKeyArtifactsLambda = new lambdaNodejs.NodejsFunction(this, Constants.LEASE_WISELY_GET_KEY_ARTIFACTS_LAMBDA, {
      entry: 'src/lambda/leaseWiselyGetKeyArtifactsLambda.ts', // Path to your Lambda code
      handler: 'getKeyArtifactsHandler', // The exported function name for creating contacts
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        TABLE_NAME: leaseWiselyUserLeaseTable.tableName,
        OPENAI_KEY: open_ai_homey_key,
        OPEN_AI_MODEL: "gpt-4o-mini",
        LEASE_WISELY_SNS_TOPIC_ARN: snsTopicLeaseWiselyUserRegisteration.topicArn,
        LEASEWISELY_NEWLEASE_S3_BUCKET_NAME: Constants.LEASE_WISELY_NEW_LEASES_S3_BUCKET,
        LEASEWISELY_NEWLEASE_DYNAMODB_TABLE_NAME: Constants.LEASE_WISELY_NEW_LEASES_TABLE,
        LEASEWISELY_USERLEASE_DYNAMODB_TABLE_NAME: Constants.LEASE_WISELY_USER_LEASES_TABLE,
        LEASE_WISELY_PDF_READY_TO_PARSE_SNS_TOPIC_ARN: snsTopicLeaseWiselyPDFReadyToParse.topicArn,
        LEASEWISELY_SQS_QUEUE_URL: queue.queueUrl
      },
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      functionName: Constants.LEASE_WISELY_GET_KEY_ARTIFACTS_LAMBDA,
      layers: [leaseWiselyLayer]
    })



    const leaseWiselyBuildTextLambda = new lambdaNodejs.NodejsFunction(this, Constants.LEASE_WISELY_BUILD_TEXT_LAMBDA, {
      entry: 'src/lambda/leaseWiselyBuildLeaseTextLambda.ts', // Path to your Lambda code
      handler: 'buildTextHandler', // The exported function name for creating contacts
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        TABLE_NAME: leaseWiselyUserLeaseTable.tableName,
        OPENAI_KEY: open_ai_homey_key,
        OPEN_AI_MODEL: "gpt-4o-mini",
        LEASE_WISELY_SNS_TOPIC_ARN: snsTopicLeaseWiselyUserRegisteration.topicArn,
        LEASEWISELY_NEWLEASE_S3_BUCKET_NAME: Constants.LEASE_WISELY_NEW_LEASES_S3_BUCKET,
        LEASEWISELY_NEWLEASE_DYNAMODB_TABLE_NAME: Constants.LEASE_WISELY_NEW_LEASES_TABLE,
        LEASEWISELY_USERLEASE_DYNAMODB_TABLE_NAME: Constants.LEASE_WISELY_USER_LEASES_TABLE,
        LEASE_WISELY_PDF_READY_TO_PARSE_SNS_TOPIC_ARN: snsTopicLeaseWiselyPDFReadyToParse.topicArn,
        LEASEWISELY_SQS_QUEUE_URL: queue.queueUrl
      },
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      functionName: Constants.LEASE_WISELY_BUILD_TEXT_LAMBDA,
      layers: [leaseWiselyLayer]
    })

    // Grant the Lambda function permissions to send messages to the SQS queue
    //queue.grantSendMessages(leaseWiselyBuildTextLambda)

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['sqs:SendMessage'],
      resources: ['arn:aws:sqs:us-east-2:211125579415:Ready-For-PDFToText']
    }));

    snsTopicLeaseWiselyPDFReadyToParse.grantPublish(leaseWiselyBuildTextLambda)

    snsTopicLeaseWiselyUserRegisteration.addSubscription(
      new snsSubscriptions.LambdaSubscription(leaseWiselyBuildTextLambda)
    );

    const leaseWiselyLeaseConversationLambda = new lambdaNodejs.NodejsFunction(this, Constants.LEASE_WISELY_LEASE_CONVERSATIONS_LAMBDA, {
      entry: 'src/lambda/leaseWiselyConversationsLambda.ts', // Path to your Lambda code
      handler: 'leaseConversationsHandler', // The exported function name for creating contacts
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        TABLE_NAME: leaseWiselyUserLeaseTable.tableName,
        OPENAI_KEY: open_ai_homey_key,
        OPEN_AI_MODEL: "gpt-4o-mini"
      },
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      functionName: Constants.LEASE_WISELY_LEASE_CONVERSATIONS_LAMBDA,
      layers: [leaseWiselyLayer]
    })

    const leaseWiselyUploadLeaseLambda = new lambdaNodejs.NodejsFunction(this, Constants.LEASE_WISELY_UPLOAD_LEASE_LAMBDA, {
      entry: 'src/lambda/uploadLeaseLambda.ts', // Path to your Lambda code
      handler: 'uploadLeaseHandler', // The exported function name for creating contacts
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        LEASEWISELY_NEWLEASE_S3_BUCKET_NAME: Constants.LEASE_WISELY_NEW_LEASES_S3_BUCKET,
        LEASEWISELY_NEWLEASE_DYNAMODB_TABLE_NAME: Constants.LEASE_WISELY_NEW_LEASES_TABLE,
        OPENAI_KEY: open_ai_homey_key,
        OPEN_AI_MODEL: "gpt-4o-mini"
      },
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      functionName: Constants.LEASE_WISELY_UPLOAD_LEASE_LAMBDA,
      layers: [leaseWiselyLayer]
    })


    golfProAIUserTable.grantReadWriteData(conversationLambda)
    golfProAIUserConversationsTable.grantReadWriteData(conversationLambda)
    golfProBrandsTable.grantReadWriteData(conversationLambda)


    leaseWiselyUserLeaseTable.grantReadWriteData(leaseWiselyLeaseConversationLambda)
    leaseWiselyNewLeaseTable.grantReadWriteData(leaseWiselyUploadLeaseLambda)
    leaseWiselyUserLeaseTable.grantReadWriteData(leaseWiselyBuildTextLambda)
    leaseWiselyNewLeaseTable.grantReadWriteData(leaseWiselyBuildTextLambda)

    leaseWiselyUserLeaseTable.grantReadWriteData(leaseWiselyGetKeyArtifactsLambda)


    /*    
            // Create Lambda function for creating contacts
            const analyseJournalEntryLambda = new lambdaNodejs.NodejsFunction(this, 'AnalyseJournalEntryFunction', {
              entry: 'src/lambda/analyse-journal-entries.ts', // Path to your Lambda code
              handler: 'analyseJournalEntryHandler', // The exported function name for creating contacts
              runtime: lambda.Runtime.NODEJS_18_X,
              environment: {
                TABLE_NAME: tenTenJournalTable.tableName,
              },
              role: lambdaRole,
              timeout: cdk.Duration.minutes(5),
              functionName: Constants.TEN_TEN_ANALYSE_JOURNAL_ENTRY_LAMBDA
            })
            
            // Grant permissions to access DynamoDB
            tenTenJournalTable.grantReadWriteData(analyseJournalEntryLambda)
    */
    // Define S3 read/write permissions
    const s3ReadWritePolicy = new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:ListBucket',
        's3:PutObjectAcl'
      ],
      resources: [
        'arn:aws:s3:::leasewisely-newleases/*'
      ]
    });
    leaseWiselyUploadLeaseLambda.role?.attachInlinePolicy(new iam.Policy(this, 'LeaseWiselyUploadLeaseLambdaS3Policy', {
      statements: [s3ReadWritePolicy]
    }));
    /*
            // Attach S3 permissions to the Lambda role
            analyseJournalEntryLambda.role?.attachInlinePolicy(new iam.Policy(this, 'AnalyseJournalEntryLambdaS3Policy', {
              statements: [s3ReadWritePolicy]
            }));
    */

    /*
        // Create Lambda function for getting contacts
        const getContactLambda = new lambdaNodejs.NodejsFunction(this, Constants.RETRIEVE_CONTACTS_LAMBDA, {
          entry: 'src/lambda/get-users.ts', // Path to your Lambda code
          handler: 'retrieveContactHandler', // The exported function name for getting contacts
          runtime: lambda.Runtime.NODEJS_18_X,
          environment: {
            TABLE_NAME: golfProAIUserTable.tableName,
          },
          functionName: Constants.RETRIEVE_CONTACTS_LAMBDA
        })
    
        // Grant permissions to access DynamoDB
        golfProAIUserTable.grantReadData(getContactLambda)
    */


    // Create API Gateway
    const api = new apigateway.RestApi(this, 'GolfProAI-Users-api', {
      deployOptions: {
        stageName: 'v1',
      },
    })

    const usersResource = api.root.addResource('users')
    const employeesResource = api.root.addResource('employees')
    const projectsResource = api.root.addResource('projects')
    const tasksResource = api.root.addResource('tasks')
    const journalResource = api.root.addResource('journals')
    const journalAnalysisResource = api.root.addResource('journalsAnalysis')
    const debtCalcResource = api.root.addResource("debtCalculator")
    const conversationsResource = api.root.addResource('conversations')
    const recommendationsResource = api.root.addResource('recommendations')
    const favoriteRecommendationsResource = api.root.addResource('favoriteRecommendations')
    const fetchFavoriteRecommendationsResource = api.root.addResource('getFavoriteRecommendations')

    const duserLeaseResource = api.root.addResource('leasewisely')

    const userLeaseConversationsResource = api.root.addResource('leasewiselyConversations')

    const newLeaseResource = api.root.addResource('leasewiselyNewLeases')
    const leaseWiselyUserRegisterationResource = api.root.addResource('leaseWiselyUserRegisterationResource')
    const pdfToTextResource = api.root.addResource('pdfToTextResource')
    const leaseWiselyGetKeyArtifactsResource = api.root.addResource('getKeyArtifactsResource')

    // Add GET method to retrieve contacts
    const getConversationsIntegration = new apigateway.LambdaIntegration(conversationLambda)
    conversationsResource.addMethod('GET', getConversationsIntegration)

    // Add POST method to upload new Lease
    const postNewLeaseIntegration = new apigateway.LambdaIntegration(leaseWiselyUploadLeaseLambda)
    newLeaseResource.addMethod('POST', postNewLeaseIntegration)

    // Add POST method to upload new Lease
    const pdfToTextIntegration = new apigateway.LambdaIntegration(leaseWiselyBuildTextLambda)
    pdfToTextResource.addMethod('POST', pdfToTextIntegration)

    // Add POST method to upload new Lease
    const getKeyAtifactsIntegration = new apigateway.LambdaIntegration(leaseWiselyGetKeyArtifactsLambda)
    leaseWiselyGetKeyArtifactsResource.addMethod('GET', getKeyAtifactsIntegration)

    // Add POST method to retrieve contacts
    const userRegisteredIntegration = new apigateway.LambdaIntegration(leaseWiselyNewUserRegistrationLambda)
    leaseWiselyUserRegisterationResource.addMethod('POST', userRegisteredIntegration)

    // Add GET method to retrieve contacts
    const getUserLeaseConversationsIntegration = new apigateway.LambdaIntegration(leaseWiselyLeaseConversationLambda)
    userLeaseConversationsResource.addMethod('GET', getUserLeaseConversationsIntegration)

    // Give the lambda function access to AWS Pinpoint
    const pinpointAccessPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['mobiletargeting:*'],
      resources: ['*'],
    })

    // IAM Policy to send emails using SES
    const sesSendEmailPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    })

    // Output the API endpoint URL
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
    })
  }
}
