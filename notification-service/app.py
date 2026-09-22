from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "notification-service"
    })


@app.route("/notify", methods=["POST"])
def notify():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    message = data.get("message")

    if not message:
        return jsonify({
            "error": "Message is required"
        }), 400

    return jsonify({
        "status": "notification sent",
        "message": message
    }), 200


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )