import os
import json
import urllib.request

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

PABBLY_WEBHOOK_URL = os.getenv("PABBLY_WEBHOOK_URL", "").strip()


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

    notification_response = {
        "status": "notification received",
        "message": message
    }

    if PABBLY_WEBHOOK_URL:
        try:
            webhook_data = {
                "message": message,
                "incident_id": data.get("incident_id"),
                "title": data.get("title"),
                "severity": data.get("severity"),
                "created_by": data.get("created_by"),
                "created_by_email": data.get("created_by_email")
            }

            webhook_request = urllib.request.Request(
                PABBLY_WEBHOOK_URL,
                data=json.dumps(webhook_data).encode("utf-8"),
                headers={
                    "Content-Type": "application/json"
                },
                method="POST"
            )

            with urllib.request.urlopen(webhook_request, timeout=5) as response:
                notification_response["pabbly"] = {
                    "status": "webhook sent",
                    "http_status": response.status
                }

        except Exception:
            notification_response["pabbly"] = {
                "status": "webhook failed"
            }
    else:
        notification_response["pabbly"] = {
            "status": "webhook not configured"
        }

    return jsonify(notification_response), 200


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )
