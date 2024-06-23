// constants.ts
export const AWS_ACCOUNT = "211125579415"
export const AWS_REGION = "us-east-2"

export const LAMBDA_ROLE = "LeasewiselyLambdaRole"

//export const AWS_ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT
//export const AWS_REGION = process.env.CDK_DEFAULT_REGION

// Since the Pinpoint is done manually. This needs to be updated for deployment - IF YOU ARE CREATING A NEW Pinpoint Project

// Production application ID = 2794595018b548c89e9ee4a88bba0b24
// Staging application ID = 9871c5e6bd70425bb81e0b1931b43f3f
// NOTE: This value MUST be consistent with the one in utils/constants.ts
export const PINPOINT_CONTACT_COMMUNICATIONS_APPLICATION = "c1eb640662a348bcb3e67835f1614451"

// AutoBuilds from the AWS Variables
export const ALERT_ADMIN_SNS_QUEUE = "arn:aws:sns:"+AWS_REGION+":"+AWS_ACCOUNT+":GolfProAI-ContactSNSTopic-AdminAlerts"
export const USER_VERIFICATION_SNS_QUEUE = "arn:aws:sns:"+AWS_REGION+":"+AWS_ACCOUNT+":GolfProAI-ContactSNSTopic-ContactVerification"
export const CONTACTS_TABLE_ARN = "arn:aws:dynamodb:"+AWS_REGION+":"+AWS_ACCOUNT+":table/GolfProAIContacts"
export const CONTACTS_VERIFICATION_TABLE_ARN = "arn:aws:dynamodb:"+AWS_REGION+":"+AWS_ACCOUNT+":table/GolfProAIContactsVerification"

// Contacts Table
//export const CONTACTS_TABLE = "GolfProAIContacts"

// Contacts Table
export const GOLF_PRO_USERS_TABLE = "GolfProUsers"
export const GOLF_PRO_USERS_CONVERSATIONS_TABLE = "GolfProUsersConversations"
export const GOLF_PRO_BRANDS_TABLE = "GolfProBrands"

export const GOLF_PRO_USERS_RECOMMENDATIONS_TABLE = "GolfProUsersRecommendations"
export const LEASE_WISELY_USERS_TABLE = "LeaseWiselyUsers"
export const LEASE_WISELY_USER_LEASES_TABLE = "LeaseWiselyUserLeases"
export const LEASE_WISELY_NEW_LEASES_TABLE = "LeaseWiselyNewLeases"
export const LEASE_WISELY_NEW_LEASES_S3_BUCKET = "leasewisely-newleases"
export const LEASE_WISELY_USER_LEASE_MAPPING_TABLE = "LeaseWiselyUserLeaseMapping"


export const GOLF_PRO_USERS_TABLE_ARN = "arn:aws:dynamodb:" + exports.AWS_REGION + ":" + exports.AWS_ACCOUNT + ":table/" + GOLF_PRO_USERS_TABLE;

export const GOLF_PRO_USERS_TABLE_PARTITION_KEY = 'email'
export const GOLF_PRO_USERS_TABLE_SORT_KEY = 'name'

export const GOLF_PRO_CREATE_USER_LAMBDA = "GolfProCreateUsersLambda"
export const GOLF_PRO_RETRIEVE_USER_LAMBDA = "GolfProRetrieveUsersLambda"
export const GOLF_PRO_UPDATE_USER_LAMBDA = "GolfProUpdateUsersLambda"
export const GOLF_PRO_CONVERSATION_LAMBDA = "GolfProConversationLambda"
export const GOLF_PRO_RECOMMENDATIONS_LAMBDA = "GolfProRecommendationsLambda"
export const GOLF_PRO_FAVORITE_RECOMMENDATIONS_LAMBDA = "GolfProFavoriteRecommendationsLambda"
export const GOLF_PRO_GET_FAVORITE_RECOMMENDATIONS_LAMBDA = "GolfProGetFavoriteRecommendationsLambda"

export const LEASE_WISELY_LEASE_CONVERSATIONS_LAMBDA = "LeaseWiselyLeaseConversationLambda"
export const LEASE_WISELY_UPLOAD_LEASE_LAMBDA = "LeaseWiselyUploadLeaseLambda"
export const LEASE_WISELY_NEW_USER_REGISTERATION_LAMBDA = "LeaseWiselyNewUserRegisterationLambda"
export const LEASE_WISELY_BUILD_TEXT_LAMBDA = "LeaseWiselyBuildTextLambda"
export const LEASE_WISELY_PARSE_PDF_LAMBDA = "LeaseWiselyParsePDFLambda"
export const LEASEWISELY_SQS_QUEUE_URL="Ready-For-PDFToText.fifo"
export const LEASE_WISELY_GET_KEY_ARTIFACTS_LAMBDA = "LeaseWiselyGetKeyArtifactsLambda"
export const LEASEWISELY_GPT_MODEL_NAME = "OPEN_AI_MODEL"

export const GOLF_PRO_USERS_TABLE_NAME_IDX = 'NameIndex'
export const GOLF_PRO_CONVERSATIONS_TABLE_TIMESTAMP_IDX = 'TimeStampIndex'
export const GOLF_PRO_RECOMMENDATIONS_TABLE_TIMESTAMP_IDX = 'TimeStampIndex'

export const GOLF_PRO_JOURNAL_TABLE_TIMESTAMP_IDX = "TimestampIndex"

// Ten Ten Resources


export const CONTACTS_TABLE_SORT_KEY = 'email'
export const CONTACTS_TABLE_PARTITION_KEY = 'contactId'
export const CONTACTS_TABLE_CONTACTID_IDX = 'ContactIdIndex'
export const CONTACTS_TABLE_EMAIL_IDX = 'EmailIndex'

// S3 Bucket
export const BULK_UPLOAD_BUCKET = 'bulk-upload-contacts'
export const BULK_UPLOAD_CSV = 'uploadContacts.csv'

// Contacts Verification Table
export const CONTACTS_VERIFICATION_TABLE = "GolfProAIContactsVerification"
export const CONTACTS_VERIFICATION_TABLE_SORT_KEY = 'contactId'
export const CONTACTS_VERIFICATION_TABLE_PARTITION_KEY = 'contactVerificationId'
//export const CONTACTS_VERIFICATION_TABLE_CONTACTID_IDX = 'ContactIdIndex'
//export const CONTACTS_VERIFICATION_TABLE_EMAIL_IDX = 'EmailIndex'

export const CREATE_CONTACTS_LAMBDA = "createGolfProContactLambda"
export const RETRIEVE_CONTACTS_LAMBDA = "fetchGolfProContactLambda"
export const UPDATE_CONTACTS_LAMBDA = "updateGolfProContactLambda"

export const SUCCESS = 200
export const ERROR = 400
export const DOES_NOT_EXIST = 404
export const INTERNAL_ERROR = 500

export const POST = 'POST'
export const DELETE = 'DELETE'
export const GET = 'GET'
export const PUT = 'PUT'

// Source of Contacts being created
export const WEB_LEAD = "web-lead"
export const BULK_UPLOAD = "bulk-upload"