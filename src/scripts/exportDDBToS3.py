import boto3
import csv
from io import StringIO
import os
import logging

from dotenv import load_dotenv  # Import the dotenv package

# Setup basic configuration for logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables from .env file
load_dotenv()

accessKKey = os.getenv("AWS_ACCESS_KEY")
secret = os.getenv("AWS_ACCESS_KEY_SECRET")

leaseSummaryTable = os.getenv("LEASE_SUMMARY_TABLE")
dataFieldsToCollectTable = os.getenv("DATA_FIELDS_TO_COLLECT_TABLE")
landlordNoticesTable = os.getenv("LANDLORD_NOTICES_TABLE")
mainentenceutilitiesTable = os.getenv("MAINENTENCE_UTILITIES_TABLE")
moveinTable = os.getenv("MOVE_IN_TABLE")
redFlagTable = os.getenv("RED_FLAG_TABLE")
renewalAndMoveOutTable = os.getenv("RENEWAL_AND_MOVEOUT_TABLE")
rentAndFeeTable = os.getenv("RENT_AND_FEE_TABLE")
rulesAndRegulationsTable = os.getenv("RULES_AND_REGULATIONS_TABLE")
timelinesTable = os.getenv("TIMELINE_TABLE")
userLeasesTable = os.getenv("USER_LEASES_TABLE")
#TempDataUpload = 'TempDataUpload'

s3_bucket_name = 'leasewisely-dataexported'

session = boto3.Session(
    aws_access_key_id=accessKKey,
    aws_secret_access_key=secret,
    region_name=os.getenv("AWS_REGION", "us-east-2")
)

# DynamoDB and S3 configurations
table_names = {
    leaseSummaryTable: os.getenv("LEASE_SUMMARY_TABLE"),
    dataFieldsToCollectTable: os.getenv("DATA_FIELDS_TO_COLLECT_TABLE"),
    landlordNoticesTable: os.getenv("LANDLORD_NOTICES_TABLE"),
    mainentenceutilitiesTable: os.getenv("MAINENTENCE_UTILITIES_TABLE"),
    moveinTable: os.getenv("MOVE_IN_TABLE"),
    redFlagTable: os.getenv("RED_FLAG_TABLE"),
    renewalAndMoveOutTable: os.getenv("RENEWAL_AND_MOVEOUT_TABLE"),
    rentAndFeeTable: os.getenv("RENT_AND_FEE_TABLE"),
    rulesAndRegulationsTable: os.getenv("RULES_AND_REGULATIONS_TABLE"),
    timelinesTable: os.getenv("TIMELINE_TABLE"),
    userLeasesTable: os.getenv("USER_LEASES_TABLE"),
    #TempDataUpload: 'TempDataUpload'
}

def dynamodb_to_csv_s3():
    for table_name_key, table_name in table_names.items():
        if not table_name:
            logging.warning(f"Table name for {table_name_key} is not set.")
            continue

        try:
            dynamodb = session.resource('dynamodb')
            table = dynamodb.Table(table_name)
            s3_file_path = f"{table_name}.csv"

            # Check if S3 bucket name is set
            if not s3_bucket_name:
                raise ValueError("S3 bucket name is not set.")

            s3 = session.client('s3')

            response = table.scan()
            data = response['Items']

            # Handle pagination in DynamoDB
            while 'LastEvaluatedKey' in response:
                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                data.extend(response['Items'])

            if data:
                with StringIO() as csv_file:
                    csv_writer = csv.writer(csv_file)
                    headers = list(data[0].keys())
                    csv_writer.writerow(headers)
                    logging.info(f"Data for headers {headers}")

                    for item in data:
                        csv_writer.writerow([item.get(header, '') for header in headers])

                    s3.put_object(Bucket=s3_bucket_name, Key=s3_file_path, Body=csv_file.getvalue())
                    logging.info(f"Data from {table_name} uploaded to {s3_bucket_name}/{s3_file_path}")
            else:
                logging.info(f"No data found in {table_name}.")
        except Exception as e:
            logging.error(f"Error processing {table_name}: {str(e)}")

# Usage
dynamodb_to_csv_s3()
