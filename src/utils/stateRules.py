import json
import boto3
import csv

# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')

def load_data(file_path):
    # Load data from the CSV file
    with open(file_path, newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        data = [row for row in reader]
    return data

def save_to_dynamodb(data):
    table = dynamodb.Table('LeaseWiselyStateRules')  # Specify your DynamoDB table name
    with table.batch_writer() as batch:
        for item in data:
            # Put each item into the DynamoDB table
            batch.put_item(Item=item)

# Main execution
if __name__ == "__main__":
    csv_file_path = '/Users/vikas/builderspace/leasewisely/src/utils/State_Laws.csv'  # Update this path to where your CSV file is stored
    state_rules = load_data(csv_file_path)
    save_to_dynamodb(state_rules)
    print("Data loaded into DynamoDB successfully.")
