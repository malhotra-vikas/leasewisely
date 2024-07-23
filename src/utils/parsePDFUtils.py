import json
import os
from openai import OpenAI

client = OpenAI(api_key='sk-pM') 

from pdfminer.high_level import extract_text
from pdfminer.pdfparser import PDFSyntaxError
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError

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

def write_to_dynamodb(email, text):
    try:
        # Initialize a session using boto3
        dynamodb = boto3.resource(
            'dynamodb',
            region_name='us-east-2',  # Replace with your region
            aws_access_key_id='',  # Replace with your actual access key
            aws_secret_access_key='+'  # Replace with your actual secret key
        )
        # Specify the table
        table_name = "XXXXLeaseWiselyUserLeases"  # Replace with your DynamoDB table name
        table = dynamodb.Table(table_name)

        # Update the leaseText field for the given email
        response = table.update_item(
            Key={
                'email': email
            },
            UpdateExpression="SET leaseText = :leaseText",
            ExpressionAttributeValues={
                ':leaseText': text
            },
            ReturnValues="UPDATED_NEW"
        )
        
        print(f"Update successful. Updated attributes: {response.Attributes}")
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

def extractKeyArtifactsUsingAI(text):
    try:
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
        Extract the following details from the lease agreement: 
        - Property Manager Name
        - Property Manager PhoneNumber
        - Property Manager Email
        - Emergency Maintenance Number
        - Rent DueDate
        - Rent Amount
        - Late Fee Rules
        - Security Deposit Amount
        - Include Pet
        - Pet Fee
        - Resident Names
        
        Here is the lease PDF: "{text}"
        """

        # Make a request to OpenAI's ChatCompletion API
        response = client.chat.completions.create(model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are Real Estate Agent who understands lease documents very well."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500,
        temperature=0.7)

        # Extracting the response text
        result_text = response.choices[0].message.content.strip()


        print(f"Extracted attributes: {result_text}")

        # Parsing the result (example of parsing for resident names)
        extracted_data = {
            'propertyManagerName': '',
            'propertyManagerPhoneNumber': '',
            'propertyManagerEmail': '',
            'emergencyMaintenanceNumber': '',
            'rentDueDate': '',
            'rentAmount': '',
            'lateFeeRules': '',
            'securityDepositAmount': '',
            'includePet': '',
            'petFee': '',
            'residentNames': ''
        }

        return {
            'statusCode': 200,
            'body': 'Lease text updated successfully'
        }
    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return {
            'statusCode': 500,
            'body': f"Error: {e}"
        }



if __name__ == "__main__":
    file_path = "/Users/vikas/Desktop/LeaseWisely/11456 N 57th Lease.pdf"  # Replace with the path to your PDF file
    email = "malhotra.vikas@gmail.com"  # Replace with the user's email
    result = readPDF(file_path)
    write_result = write_to_dynamodb(email, result)
    #print(f"Result: {write_result}")
    extractKeyArtifactsUsingAI(result)
