import boto3
import os
import json
from datetime import datetime
from openai import OpenAI, Configuration

# Read environment variables
openai_api_key = os.getenv('OPENAI_API_KEY')
dynamodb_table_name = os.getenv('USER_LEASES_TABLE') 

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(dynamodb_table_name)

# Initialize OpenAI client
configuration = Configuration(api_key=os.getenv('OPENAI_API_KEY'))
openai = OpenAI(configuration)

class LeaseAPI:
    @staticmethod
    def handle_conversation(email: str, lease_uuid: str, user_input: str):
        try:
            # Fetch user lease context
            context = LeaseAPI.get_user_lease_context(email, lease_uuid)
            if context is None:
                context = []

            json_context = json.dumps(context)
            print(f"In Handle Conversations - Context: {json_context}")

            conversation_response = LeaseAPI.ask_openai(user_input, json_context)
            print(f"In Handle Conversations - AI Response: {conversation_response}")

            return json.dumps(conversation_response)

        except Exception as error:
            print(f"Failed to process the AI response: {error}")
            return ''

    @staticmethod
    def get_user_lease_context(email: str, lease_uuid: str):
        print(f"Searching for email in user context conversations: {email}")
        try:
            params = {
                'TableName': dynamodb_table_name,
                'KeyConditionExpression': '#pk = :email and #sk = :uuid',
                'ExpressionAttributeNames': {
                    '#pk': 'email',
                    '#sk': 'uuid'
                },
                'ExpressionAttributeValues': {
                    ':email': email,
                    ':uuid': lease_uuid
                }
            }
            print(f"Searching for params: {json.dumps(params)}")
            result = table.query(**params)
            if 'Items' in result:
                lease_context = LeaseAPI.extract_contexts(result['Items'])
                return lease_context
            return None

        except Exception as error:
            print(f"Error fetching lease context: {error}")
            return None

    @staticmethod
    def extract_contexts(items: list):
        print(f"In extract_contexts, items: {items}")
        contexts = [item['leaseText'] for item in items if 'leaseText' in item]
        print(f"In extract_contexts, contexts: {contexts}")
        return contexts

    @staticmethod
    def ask_openai(question: str, context: str):
        print(f"In askOpenAI - Question: {question}")
        print(f"In askOpenAI - Context: {context}")

        effective_prompt = "LeaseText:\n"
        engineered_prompt = f"Help me find an answer to this question. If the question is about a date, give a factual date in the response: {question} in this lease: "

        try:
            context_array = json.loads(context)
            if isinstance(context_array, list) and context_array:
                effective_prompt += f"{'\n'.join(context_array)}\n\n"
            engineered_prompt += effective_prompt

        except json.JSONDecodeError as error:
            print(f"Error parsing context, using question only: {error}")
            engineered_prompt = question

        print(f"Model: 'gpt-4o' in this lease: ")
        print(f"In askOpenAI - Engineered Prompt: {engineered_prompt}")

        chat_messages = [
            {
                "role": "system",
                "content": "You are a Residential Lease Expert. You are designed to give great answers to people's questions about their Leases. You apply context for the lease using LeaseText and you also use past responses while giving answers. If the user's question is about a date, you are very specific and factual."
            },
            {
                "role": "user",
                "content": engineered_prompt
            }
        ]

        try:
            response = openai.Completion.create(
                model='gpt-4o',
                messages=chat_messages,
                max_tokens=1000
            )

            if response and 'choices' in response and response['choices']:
                completion = response['choices'][0]['message']['content'].strip()
                return {
                    'statusCode': 200,
                    'body': completion
                }

            raise Exception("No completion found or completion was empty.")

        except Exception as error:
            print(f"Error in askOpenAI: {error}")
            return {
                'statusCode': 500,
                'body': str(error)
            }

    @staticmethod
    def save_user_context(email: str, question: str, response: str):
        context = json.dumps({
            'question': question,
            'response': response
        })
        params = {
            'TableName': dynamodb_table_name,
            'Item': {
                'email': email,
                'Context': context,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        try:
            table.put_item(**params)
        except Exception as error:
            print(f"Error saving user context: {error}")

