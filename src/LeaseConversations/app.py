from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/run-script', methods=['GET'])
def run_script():
    # Example: Running a simple Python script
    result = {"message": "Script executed successfully!", "status": "success"}
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
