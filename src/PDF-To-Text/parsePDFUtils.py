import json
import os
from openai import OpenAI
from dotenv import load_dotenv
import re
import logging
import datetime
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# Load environment variables from .env file
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY_PDF_PARSING"))

from pdfminer.high_level import extract_text
from pdfminer.pdfparser import PDFSyntaxError

import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError

sqs = boto3.client("sqs")
queue_url = os.getenv("SQS_URL")

accessKKey = os.getenv("AWS_ACCESS_KEY")
secret = os.getenv("AWS_ACCESS_KEY_SECRET")

userLeasesTable = os.getenv("USER_LEASES_TABLE")
leaseSummaryTable = os.getenv("LEASE_SUMMARY_TABLE")
timelinesTable = os.getenv("TIMELINE_TABLE")
redFlagTable = os.getenv("RED_FLAG_TABLE")
rentAndFeeTable = os.getenv("RENT_AND_FEE_TABLE")
moveinTable = os.getenv("MOVE_IN_TABLE")
mainentenceTable = os.getenv("MAINENTENCE_TABLE")
utilitiesTable = os.getenv("UTILITIES_TABLE")
rulesAndRegulationsTable = os.getenv("RULES_AND_REGULATIONS_TABLE")
landlordNoticesTable = os.getenv("LANDLORD_NOTICES_TABLE")
dataFieldsToCollectTable = os.getenv("DATA_FIELDS_TO_COLLECT_TABLE")
renewalAndMoveOutTable = os.getenv("RENEWAL_AND_MOVEOUT_TABLE")
mainentenceutilitiesTable = os.getenv("MAINENTENCE_UTILITIES_TABLE")
pdfReaderEngine = os.getenv("PDF_READER_ENGINE")

# Check if the variable is None and set a default value if it is
if pdfReaderEngine is None:
    pdfReaderEngine = "pdfminer"  # Specify the default value

sleepTime = 30

# Initialize a session using boto3
dynamodb = boto3.resource(
    "dynamodb",
    region_name="us-east-2",  # Replace with your region
    aws_access_key_id=accessKKey,
    aws_secret_access_key=secret,
)


def download_from_s3(bucket_name, file_key, download_path):
    try:
        s3 = boto3.client(
            "s3", aws_access_key_id=accessKKey, aws_secret_access_key=secret
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
        if (pdfReaderEngine == 'pdfminer'):
            text = ""
            text = extract_text(filePath)
            print(f"Extracted text: {text[:500]}")  # Print the first 500 characters

        if (pdfReaderEngine == 'pdfplumber'):
            text = ""
            '''
            with pdfplumber.open(filePath) as pdf:
                # Loop through each page in the PDF
                for page in pdf.pages:
                    # Extract text from the current page
                    currentPageText = page.extract_text()
                    print(f"Extracted text on page: {currentPageText}")  # Print the first 500 characters

                    text = text + currentPageText
                    print(f"Extracted text overall: {text}")  # Print the first 500 characters
            '''
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


def setLeaseDataAvailableFlag(email, uuid):
    try:
        # Specify the table
        table_name = userLeasesTable  # Replace with your DynamoDB table name
        table = dynamodb.Table(table_name)

        # Update the leaseText field for the given email
        response = table.update_item(
            Key={"email": email, "uuid": uuid},
            UpdateExpression="SET leaseDataAvailable = :leaseDataAvailable",
            ExpressionAttributeValues={":leaseDataAvailable": "True"},
            ReturnValues="UPDATED_NEW",
        )

        print(f"Update successful")
        return {"statusCode": 200, "body": "Lease text updated successfully"}

    except NoCredentialsError:
        print("Credentials not available.")
        return {"statusCode": 403, "body": "Credentials not available."}
    except PartialCredentialsError:
        print("Incomplete credentials provided.")
        return {"statusCode": 403, "body": "Incomplete credentials provided."}
    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {"statusCode": 500, "body": f"Error: {e}"}


def add_timeline_artifacts_to_dynamodb(email, uuid, timeLineArtifact):
    try:
        # Specify the table
        table_name = userLeasesTable  # Replace with your DynamoDB table name
        table = dynamodb.Table(table_name)

        # Update the leaseText field for the given email
        response = table.update_item(
            Key={"email": email, "uuid": uuid},
            UpdateExpression="SET timeLineArtifact = :timeLineArtifact",
            ExpressionAttributeValues={":timeLineArtifact": timeLineArtifact},
            ReturnValues="UPDATED_NEW",
        )

        print(f"Update successful")
        return {"statusCode": 200, "body": "Lease text updated successfully"}

    except NoCredentialsError:
        print("Credentials not available.")
        return {"statusCode": 403, "body": "Credentials not available."}
    except PartialCredentialsError:
        print("Incomplete credentials provided.")
        return {"statusCode": 403, "body": "Incomplete credentials provided."}
    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {"statusCode": 500, "body": f"Error: {e}"}


def old_add_key_artifacts_to_dynamodb(email, uuid, keyArtifacts):
    try:
        # Specify the table
        table_name = userLeasesTable  # Replace with your DynamoDB table name
        table = dynamodb.Table(table_name)

        print("keyArtifacts are .", keyArtifacts)

        # Extract the required information
        property_address_full = keyArtifacts["body"].get("Property Address", "")
        lease_start_date = keyArtifacts["body"].get("Lease Start Date", "NA")

        # Get the Property Address before the first comma
        property_address = (
            property_address_full.split(",")[0].strip()
            if property_address_full
            else "NA"
        )

        # Update the leaseText field for the given email
        response = table.update_item(
            Key={"email": email, "uuid": uuid},
            UpdateExpression="SET keyArtifacts = :keyArtifacts, leaseStartDate = :leaseStartDate, propertyAddress = :propertyAddress, leaseDataAvailable = :leaseDataAvailable",
            ExpressionAttributeValues={
                ":keyArtifacts": keyArtifacts,
                ":leaseStartDate": lease_start_date,
                ":propertyAddress": property_address,
                ":leaseDataAvailable": "True",
            },
            ReturnValues="UPDATED_NEW",
        )

        print(f"Update successful")
        return {"statusCode": 200, "body": "Lease text updated successfully"}

    except NoCredentialsError:
        print("Credentials not available.")
        return {"statusCode": 403, "body": "Credentials not available."}
    except PartialCredentialsError:
        print("Incomplete credentials provided.")
        return {"statusCode": 403, "body": "Incomplete credentials provided."}
    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {"statusCode": 500, "body": f"Error: {e}"}


def persistLeaseText(email, uuid, text):
    try:
        # Specify the table
        table_name = userLeasesTable  # Replace with your DynamoDB table name
        table = dynamodb.Table(table_name)

        # Update the leaseText field for the given email
        response = table.update_item(
            Key={"email": email, "uuid": uuid},
            UpdateExpression="SET leaseText = :leaseText",
            ExpressionAttributeValues={":leaseText": text},
            ReturnValues="UPDATED_NEW",
        )

        print(f"Update successful. ")
        return {"statusCode": 200, "body": "Lease text updated successfully"}

    except NoCredentialsError:
        print("Credentials not available.")
        return {"statusCode": 403, "body": "Credentials not available."}
    except PartialCredentialsError:
        print("Incomplete credentials provided.")
        return {"statusCode": 403, "body": "Incomplete credentials provided."}
    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {"statusCode": 500, "body": f"Error: {e}"}


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
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are Real Estate Agent who understands lease documents very well.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=500,
            temperature=0.3,
        )

        # Extracting the response text
        result_text = response.choices[0].message.content.strip()

        # Regex to extract JSON block
        json_match = re.search(r"{.*}", result_text, re.DOTALL)
        if json_match:
            json_content = json_match.group(0)
        else:
            logging.error(f"No JSON content found in response: {result_text}")
            json_content = "{}"

        # Print the cleaned result for debugging
        logging.info(f"Extracted JSON content: {json_content}")

        # Clean the result_text
        # cleaned_result_text = result_text.strip().strip("```json").strip("```").strip()

        # Try to parse the response as JSON
        try:
            extracted_data = json.loads(json_content)
        except json.JSONDecodeError as e:
            print(f"JSON decoding failed: {e}")
            extracted_data = {
                "error": "Failed to decode JSON from response",
                "response": json_content,
            }

        # Print the structured JSON data
        print(f"Extracted attributes: {json.dumps(extracted_data, indent=4)}")

        # Return the structured JSON data
        return {"statusCode": 200, "body": extracted_data}

    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {"statusCode": 500, "body": f"Error: {e}"}


def sanitize_attribute_name(name):
    """Replace invalid characters in attribute names with underscores."""
    return re.sub(r"[^a-zA-Z0-9_]", "_", name)


def persistBatchData(updates, email, uuid, tableName):
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(tableName)

    # Build the update expression and attribute dictionaries
    update_expression = "SET "
    expression_attribute_values = {}
    expression_attribute_names = {}
    for attr_name, value in updates.items():
        expression_placeholder = f":{attr_name}"
        attribute_name_placeholder = f"#{attr_name}"

        update_expression += (
            f"{attribute_name_placeholder} = {expression_placeholder}, "
        )
        expression_attribute_values[expression_placeholder] = value
        expression_attribute_names[attribute_name_placeholder] = attr_name

    # Remove the last comma and space from the update expression
    update_expression = update_expression.rstrip(", ")

    print("Updating for email", email)
    print("Updating for uuid", uuid)
    print("update_expression is", update_expression)
    print("expression_attribute_values is", expression_attribute_values)
    print("expression_attribute_names is", expression_attribute_names)

    try:
        response = table.update_item(
            Key={"email": email, "uuid": uuid},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names,
            ReturnValues="ALL_NEW",
        )
        print("Update successful:", response)
    except Exception as e:
        print("Failed to update item:", e)


def persistData(dataKeyName, extracted_data, email, uuid):
    # Replace spaces in attribute_name for the placeholder
    dataKeyName = f"{dataKeyName.replace(' ', '').replace('-', '').replace('/', '_').replace('(', '').replace(')', '')}"

    # Build the UpdateExpression
    update_expression = f"SET #{dataKeyName} = :val"
    print("updateStatement is:", update_expression)

    try:
        # Specify the table
        table = dynamodb.Table(userLeasesTable)

        # Update the leaseText field for the given email
        response = table.update_item(
            Key={"email": email, "uuid": uuid},
            UpdateExpression=update_expression,
            ExpressionAttributeNames={f"#{dataKeyName}": dataKeyName},
            ExpressionAttributeValues={":val": extracted_data},
            ReturnValues="UPDATED_NEW",
        )

        print(f"Update successful")
        return {"statusCode": 200, "body": "Lease text updated successfully"}

    except NoCredentialsError:
        print("Credentials not available.")
        return {"statusCode": 403, "body": "Credentials not available."}
    except PartialCredentialsError:
        print("Incomplete credentials provided.")
        return {"statusCode": 403, "body": "Incomplete credentials provided."}
    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {"statusCode": 500, "body": f"Error: {e}"}


def extractData(leaseText, prompt):

    revisedPrompt = f"""
        Here is the lease text: "{leaseText}. {prompt}"
        """
    # Make a request to OpenAI's ChatCompletion API
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": [{"type": "text", "text": revisedPrompt}]}],
        max_tokens=1000,
        temperature=0.3,
        top_p=1.0,
        frequency_penalty=0,
        presence_penalty=0,
    )

    # Extracting the response text
    result_text = response.choices[0].message.content.strip()

    print(f"Prompt: {prompt}")
    print(f"Result_text: {result_text}")

    return result_text


def load_prompts(file_path):
    """Load JSON data from a file."""
    with open(file_path, "r") as file:
        return json.load(file)


def extract_and_persist_all_keys(lease_text, category_prompts, email, uuid, tableName):

    # Initialize an empty dictionary
    updates = {}

    for key, prompt in category_prompts.items():
        try:
            # Extract and persist data for each key using the provided prompt
            result = extractData(lease_text, prompt)

            # Replace spaces in attribute_name for the placeholder
            currentKey = f"{key.replace(' ', '').replace('-', '').replace('/', '_')}"

            currentValue = result
            updates[currentKey] = currentValue

            # persistData(key, result, email, uuid)

        except Exception as e:
            print(f"Failed to process {key}: {str(e)}")

    persistBatchData(updates, email, uuid, tableName)


def process_message(email, uuid):

    # Query DynamoDB for the S3 file path using email
    table = dynamodb.Table("LeaseWiselyNewLeases")
    response = table.get_item(Key={"uuid": uuid})
    print(f"response: {response}")

    if "Item" in response:
        s3_file_key = response["Item"]["s3FilePath"]
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
            extracted_lease_text = readPDF(downloaded_file_path)

            # Load prompts from JSON file
            prompts_data = load_prompts("lease-keys-prompts.json")

            # Process each category of prompts in parallel
            prompt_categories = {
                "Rent and Fees": rentAndFeeTable,
                "Lease Summary": leaseSummaryTable,
                "Timeline": timelinesTable,
                "Red Flags": redFlagTable,
                "Move-In": moveinTable,
                "Maintenance and Utilities": mainentenceutilitiesTable,
                "Rules and Regulations": rulesAndRegulationsTable,
                "Landlord Notice": landlordNoticesTable,
                "Renewal and Move-Outs": renewalAndMoveOutTable,
                "Data Fields to Collect": dataFieldsToCollectTable,
            }

            with ThreadPoolExecutor() as executor:
                futures = []
                for category, table in prompt_categories.items():
                    print(f"Submitting {category} prompts for processing")
                    prompts = prompts_data.get(category, {})
                    future = executor.submit(
                        extract_and_persist_all_keys,
                        extracted_lease_text,
                        prompts,
                        email,
                        uuid,
                        table,
                    )
                    futures.append(future)

                for future in as_completed(futures):
                    try:
                        future.result()  # Retrieve result to catch any exceptions
                    except Exception as e:
                        print(f"Error processing prompts: {e}", exc_info=True)

            # Write PDF Extracted text to DDB
            persistLeaseText(email, uuid, extracted_lease_text)

            # Write leaseDataAvailable to the DDB
            setLeaseDataAvailableFlag(email, uuid)

        else:
            print(f"No item found in DynamoDB for email: {email}")


def poll_sqs():
    while True:
        response = sqs.receive_message(
            QueueUrl=queue_url, MaxNumberOfMessages=1, WaitTimeSeconds=2
        )

        if "Messages" in response:
            for message in response["Messages"]:
                print(f"Processing message: {message}")
                body = json.loads(message["Body"])
                email = body["email"]
                uuid = body["uuid"]

                sqs.delete_message(
                    QueueUrl=queue_url, ReceiptHandle=message["ReceiptHandle"]
                )
                start_time = datetime.datetime.now()
                human_readable_start_time = start_time.strftime("%Y-%m-%d %H:%M:%S")
                print("Started Processing at ", human_readable_start_time)

                process_message(email, uuid)

                end_time = datetime.datetime.now()
                human_readable_end_time = end_time.strftime("%Y-%m-%d %H:%M:%S")
                print("Completed Processing at ", human_readable_end_time)
                duration = end_time - start_time
                seconds = duration.total_seconds()
                print(f"Duration: {duration} (HH:MM:SS)")
                print(f"Duration in seconds: {seconds} seconds")

        else:
            print("No messages received.")


if __name__ == "__main__":
    poll_sqs()
