import json
import boto3

# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')

def load_data(file_path):
    # Load data from the JSON file
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

def save_to_dynamodb(data):
    table = dynamodb.Table('LeaseWiselyStateRules')  # Specify your DynamoDB table name
    for item in data:
        # Put each item into the DynamoDB table
        table.put_item(Item=item)

# Main execution
if __name__ == "__main__":
    json_file_path = '/Users/vikas/builderspace/leasewisely/src/utils/State_Laws.json'  # Update this path to where your JSON file is stored
    state_rules = load_data(json_file_path)
    save_to_dynamodb(state_rules)
    print("Data loaded into DynamoDB successfully.")

