import boto3
import csv
import logging
import uuid

# Setup logging
logging.basicConfig(level=logging.INFO)

# Configure your DynamoDB region
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('TempDataUpload')

# Path to your CSV file
csv_file_path = '/Users/vikas/builderspace/leasewisely/src/scripts/LeaseWiselyDataFieldsToCollect.csv'

def read_and_upload_csv(csv_file_path, table):
    try:
        with open(csv_file_path, 'r') as csvfile:
            csvreader = csv.reader(csvfile)
            headers = next(csvreader)  # Skip the header row
            with table.batch_writer() as batch:
                for row in csvreader:
                    item = {header: modify_field(header, value) for header, value in zip(headers, row)}
                    batch.put_item(Item=item)
            logging.info("Data upload completed successfully.")
    except Exception as e:
        logging.error(f"An error occurred: {e}")

def modify_field(header, value):
    tempUUOD = str(uuid.uuid4())
    if header == 'email':
        return modify_email(tempUUOD)
    elif header == 'uuid':
        return modify_uuid(tempUUOD)
    return value

def modify_email(uuid):
    # Example modification: Append a domain if not present
    email = f"{uuid}@gmail.com"
    return email

def modify_uuid(uuid):
    # Example modification: Generate a new UUID if needed
    return uuid

# Call the function to start the upload
read_and_upload_csv(csv_file_path, table)
