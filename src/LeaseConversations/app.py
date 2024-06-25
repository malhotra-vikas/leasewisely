import sys
import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from flask import Flask, request, jsonify
import src.LeaseConversations.conversation as LeaseAPI


app = Flask(__name__)

@app.route('/api/conversations', methods=['GET'])
def run_script():

    # Extract query parameters
    email = request.args.get('email', type=str)
    leaseUuid = request.args.get('leaseUuid', type=str)
    userQuery = request.args.get('query', type=str)

    # Check if parameters are not null
    if email is None or leaseUuid is None or userQuery is None:
        return jsonify({
            "message": "Missing Some query parameters.",
            "status": "error"
        }), 400

    message = f"Email is '{email}', Lease ID is '{leaseUuid}' and Query is '{userQuery}'."
    print("Query Params are ", message)

    try:
        # Call the leaseAPI and update the response accordingly
        
        api_response = LeaseAPI.LeaseAPI.handle_conversation(email, leaseUuid, userQuery)
        print("api_response is ", api_response)

        if api_response["statusCode"] == 200:
            return jsonify(api_response["body"]), 200
        else:
            return jsonify(api_response["body"]), api_response["statusCode"]

    except Exception as error:
        print("Error processing request:", error)
        return jsonify({
            "message": "Internal server error.",
            "status": "error"
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)


def buildConversation():
    result = {"message": "Script executed successfully!", "status": "success"}
    return jsonify(result)
