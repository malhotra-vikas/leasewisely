import json
import os
from openai import OpenAI
from dotenv import load_dotenv
import re
import logging

# Load environment variables from .env file
load_dotenv()
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY_PDF_PARSING'))

from pdfminer.high_level import extract_text
from pdfminer.pdfparser import PDFSyntaxError
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError

sqs = boto3.client('sqs')
queue_url = os.getenv("SQS_URL")

accessKKey = os.getenv("AWS_ACCESS_KEY")
secret = os.getenv("AWS_ACCESS_KEY_SECRET")

userLeasesTable = os.getenv("USER_LEASES_TABLE")

        # Initialize a session using boto3
dynamodb = boto3.resource(
    'dynamodb',
    region_name='us-east-2',  # Replace with your region
    aws_access_key_id=accessKKey,
    aws_secret_access_key=secret
)

def download_from_s3(bucket_name, file_key, download_path):
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=accessKKey,
            aws_secret_access_key=secret
        )
        s3.download_file(bucket_name, file_key, download_path)
        print(f"File downloaded from S3: {download_path}")
        return download_path
    except NoCredentialsError:
        print("Credentials not available.")
        return None
    except PartialCredentialsError:
        print("Incomplete credentials provided.")
        return None
    except ClientError as e:
        print(f"Error downloading file from S3: {e}")
        return None

def readPDF(filePath):

    # Extract text from the PDF file
    try:
        text = extract_text(filePath)
        print(f"Extracted text: {text[:500]}")  # Print the first 500 characters
        return text

    except PDFSyntaxError as e:
        print(f"PDFSyntaxError: {e}")
        response = {
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid PDF file."}),
        }
    except Exception as e:
        print(f"Error extracting text: {e}")
        response = {"statusCode": 500, "body": json.dumps({"error": str(e)})}

def add_lease_data_available_to_dynamodb(email, uuid):
    try:
        # Specify the table
        table_name = userLeasesTable  # Replace with your DynamoDB table name
        table = dynamodb.Table(table_name)

        # Update the leaseText field for the given email
        response = table.update_item(
            Key={
                'email': email,
                'uuid': uuid
            },
            UpdateExpression="SET leaseDataAvailable = :leaseDataAvailable",
            ExpressionAttributeValues={
                ':leaseDataAvailable': "True"
            },
            ReturnValues="UPDATED_NEW"
        )
        
        print(f"Update successful")
        return {
            'statusCode': 200,
            'body': 'Lease text updated successfully'
        }

    except NoCredentialsError:
        print("Credentials not available.")
        return {
            'statusCode': 403,
            'body': 'Credentials not available.'
        }
    except PartialCredentialsError:
        print("Incomplete credentials provided.")
        return {
            'statusCode': 403,
            'body': 'Incomplete credentials provided.'
        }
    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {
            'statusCode': 500,
            'body': f"Error: {e}"
        }

def add_timeline_artifacts_to_dynamodb(email, uuid, timeLineArtifact):
    try:
        # Specify the table
        table_name = userLeasesTable  # Replace with your DynamoDB table name
        table = dynamodb.Table(table_name)

        # Update the leaseText field for the given email
        response = table.update_item(
            Key={
                'email': email,
                'uuid': uuid
            },
            UpdateExpression="SET timeLineArtifact = :timeLineArtifact",
            ExpressionAttributeValues={
                ':timeLineArtifact': timeLineArtifact
            },
            ReturnValues="UPDATED_NEW"
        )
        
        print(f"Update successful")
        return {
            'statusCode': 200,
            'body': 'Lease text updated successfully'
        }

    except NoCredentialsError:
        print("Credentials not available.")
        return {
            'statusCode': 403,
            'body': 'Credentials not available.'
        }
    except PartialCredentialsError:
        print("Incomplete credentials provided.")
        return {
            'statusCode': 403,
            'body': 'Incomplete credentials provided.'
        }
    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {
            'statusCode': 500,
            'body': f"Error: {e}"
        }
    
def add_key_artifacts_to_dynamodb(email, uuid, keyArtifacts):
    try:
        # Specify the table
        table_name = userLeasesTable  # Replace with your DynamoDB table name
        table = dynamodb.Table(table_name)

        print("keyArtifacts are .", keyArtifacts)

        # Extract the required information
        property_address_full = keyArtifacts['body'].get('Property Address', '')
        lease_start_date = keyArtifacts['body'].get('Lease Start Date', 'NA')

        # Get the Property Address before the first comma
        property_address = property_address_full.split(',')[0].strip() if property_address_full else "NA"

        # Update the leaseText field for the given email
        response = table.update_item(
            Key={
                'email': email,
                'uuid': uuid
            },
            UpdateExpression="SET keyArtifacts = :keyArtifacts, leaseStartDate = :leaseStartDate, propertyAddress = :propertyAddress, leaseDataAvailable = :leaseDataAvailable",
            ExpressionAttributeValues={
                ':keyArtifacts': keyArtifacts,
                ':leaseStartDate': lease_start_date,
                ':propertyAddress': property_address,
                ':leaseDataAvailable': "True"
            },
            ReturnValues="UPDATED_NEW"
        )
        
        print(f"Update successful")
        return {
            'statusCode': 200,
            'body': 'Lease text updated successfully'
        }

    except NoCredentialsError:
        print("Credentials not available.")
        return {
            'statusCode': 403,
            'body': 'Credentials not available.'
        }
    except PartialCredentialsError:
        print("Incomplete credentials provided.")
        return {
            'statusCode': 403,
            'body': 'Incomplete credentials provided.'
        }
    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {
            'statusCode': 500,
            'body': f"Error: {e}"
        }

def write_to_dynamodb(email, uuid, text):
    try:
        # Specify the table
        table_name = userLeasesTable  # Replace with your DynamoDB table name
        table = dynamodb.Table(table_name)

        # Update the leaseText field for the given email
        response = table.update_item(
            Key={
                'email': email,
                'uuid': uuid
            },
            UpdateExpression="SET leaseText = :leaseText",
            ExpressionAttributeValues={
                ':leaseText': text
            },
            ReturnValues="UPDATED_NEW"
        )
        
        print(f"Update successful. ")
        return {
            'statusCode': 200,
            'body': 'Lease text updated successfully'
        }

    except NoCredentialsError:
        print("Credentials not available.")
        return {
            'statusCode': 403,
            'body': 'Credentials not available.'
        }
    except PartialCredentialsError:
        print("Incomplete credentials provided.")
        return {
            'statusCode': 403,
            'body': 'Incomplete credentials provided.'
        }
    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {
            'statusCode': 500,
            'body': f"Error: {e}"
        }
    
def extracTimeLineArtifactsUsingAI(text):
    try:
        prompt = f"""
        Extract the following dates from the lease agreement and provide them in a JSON format: 
        - Lease Signed Date
        - Leased Start Date
        - Move in Inspection Deadline Date
        - Rent Due Date
        - Renewal Offer Date
        - Notice to Vacate Date
        - Lease End Date
        - Security Deposit Return Date
        
        Here is the lease PDF: "{text}"
        """

        # Make a request to OpenAI's ChatCompletion API
        response = client.chat.completions.create(model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are Real Estate Agent who understands lease documents very well."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500,
        temperature=0.7)

        # Extracting the response text
        result_text = response.choices[0].message.content.strip()

        # Regex to extract JSON block
        json_match = re.search(r'{.*}', result_text, re.DOTALL)
        if json_match:
            json_content = json_match.group(0)
        else:
            logging.error(f"No JSON content found in response: {result_text}")
            json_content = "{}"

        # Print the cleaned result for debugging
        logging.info(f"Extracted JSON content: {json_content}")

        # Clean the result_text
        #cleaned_result_text = result_text.strip().strip("```json").strip("```").strip()



        # Try to parse the response as JSON
        try:
            extracted_data = json.loads(json_content)
        except json.JSONDecodeError as e:
            print(f"JSON decoding failed: {e}")
            extracted_data = {"error": "Failed to decode JSON from response", "response": json_content}

        # Print the structured JSON data
        print(f"Extracted attributes: {json.dumps(extracted_data, indent=4)}")

        # Return the structured JSON data
        return {
            'statusCode': 200,
            'body': extracted_data
        }

    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {
            'statusCode': 500,
            'body': f"Error: {e}"
        }

def extractKeyArtifactsUsingAI(text):
    try:
        propertyAddress = ''
        propertyManagerName = ''
        propertyManagerPhoneNumber = ''
        propertyManageEmail = ''
        emergencyMainentenceNumber = ''
        rentDueDate = ''
        rentAmount = ''
        lateFeeRules = ''
        securityDepositeAmount = ''
        includePet = ''
        petFee = ''
        residentNames = ''

        prompt = f"""
        Extract the following details from the lease agreement and provide them in a JSON format: 
        - Property Address
        - Lease Start Date
        - Lease End Date
        - Lease Signed Date
        - Property Manager Name
        - Property Manager PhoneNumber
        - Property Manager Email
        - Emergency Maintenance Number
        - Rent Due Date
        - Rent Amount
        - Late Fee Rules
        - Security Deposit Amount
        - Include Pet
        - Pet Fee
        - Resident Names
        - Move in Inspection Deadline Date
        - Renewal Offer Date
        - Notice to Vacate Date
        - Security Deposit Return Date

        
        Here is the lease PDF: "{text}"
        """

        # Make a request to OpenAI's ChatCompletion API
        response = client.chat.completions.create(model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are Real Estate Agent who understands lease documents very well."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500,
        temperature=0.7)

        # Extracting the response text
        result_text = response.choices[0].message.content.strip()

        # Clean the result_text
        cleaned_result_text = result_text.strip().strip("```json").strip("```").strip()

        # Print the cleaned result for debugging
        print(f"Cleaned result_text: {cleaned_result_text}")

        # Try to parse the response as JSON
        try:
            extracted_data = json.loads(cleaned_result_text)
        except json.JSONDecodeError as e:
            print(f"JSON decoding failed: {e}")
            extracted_data = {"error": "Failed to decode JSON from response", "response": cleaned_result_text}

        # Print the structured JSON data
        print(f"Extracted attributes: {json.dumps(extracted_data, indent=4)}")

        # Return the structured JSON data
        return {
            'statusCode': 200,
            'body': extracted_data
        }

    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {
            'statusCode': 500,
            'body': f"Error: {e}"
        }


def process_message(message):
    body = json.loads(message['Body'])
    email = body['email']
    uuid = body['uuid']

    # Query DynamoDB for the S3 file path using email
    table = dynamodb.Table('LeaseWiselyNewLeases')
    response = table.get_item(Key={'uuid': uuid})
    print(f"response: {response}")

    if 'Item' in response:
        s3_file_key = response['Item']['s3FilePath']
        print(f"s3_file_key: {s3_file_key}")

        # Remove 's3://' prefix
        path = s3_file_key[5:]
        # Split the path into bucket name and file key
        parts = path.split("/", 1)
        if len(parts) != 2:
            raise ValueError(f"Invalid S3 URL format: {s3_file_key}")

        bucket_name, file_key = parts

        s3_bucket = bucket_name

        # Define local path to save the downloaded file
        local_file_path = f"/tmp/{file_key}"
        downloaded_file_path = download_from_s3(s3_bucket, file_key, local_file_path)

        if downloaded_file_path:
            # PDF TO Text
            extracted_text = readPDF(downloaded_file_path)
            
            # Write PDF Extracted text to DDB
            write_result = write_to_dynamodb(email, uuid, extracted_text)
            
            # Extract key information
            keyArtifacts = extractKeyArtifactsUsingAI(extracted_text)

            # Write key information to the DDB
            write_result = add_key_artifacts_to_dynamodb(email, uuid, keyArtifacts)

            # Extract timeline information
            #timeLineArtifacts = extracTimeLineArtifactsUsingAI(extracted_text)

            # Write key information to the DDB
            #write_result = add_timeline_artifacts_to_dynamodb(email, uuid, timeLineArtifacts)

            # Write leaseDataAvailable to the DDB
            #write_result = add_lease_data_available_to_dynamodb(email, uuid)


    else:
        print(f"No item found in DynamoDB for email: {email}")


def poll_sqs():
    while True:
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=20
        )

        if 'Messages' in response:
            for message in response['Messages']:
                print(f"Processing message: {message}")
                process_message(message)
                sqs.delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=message['ReceiptHandle']
                )
        else:
            print("No messages received.")


if __name__ == "__main__":
    poll_sqs()
    