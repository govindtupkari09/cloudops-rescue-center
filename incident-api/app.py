import os
import urllib.request
import json

from flask import Flask, jsonify, request
from flask_cors import CORS

NOTIFICATION_SERVICE_URL = os.getenv(
    "NOTIFICATION_SERVICE_URL",
    "http://127.0.0.1:5001"
)

app = Flask(__name__)

CORS(app)


# Health Check
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy"
    })


# Sample Incident Data
incidents = [
    {
        "id": "INC001",
        "title": "Website Down",
        "severity": "HIGH",
        "status": "OPEN"
    },
    {
        "id": "INC002",
        "title": "Database Error",
        "severity": "MEDIUM",
        "status": "OPEN"
    }
]


# Get All Incidents
@app.route("/incidents", methods=["GET"])
def get_incidents():
    return jsonify(incidents)


# Get One Incident by ID
@app.route("/incidents/<incident_id>", methods=["GET"])
def get_incident(incident_id):

    for incident in incidents:
        if incident["id"] == incident_id:
            return jsonify(incident)

    return jsonify({
        "error": "Incident not found"
    }), 404


# Create New Incident
@app.route("/incidents", methods=["POST"])
def create_incident():

    data = request.get_json()

    new_incident = {
        "id": f"INC{len(incidents) + 1:03d}",
        "title": data["title"],
        "severity": data["severity"],
        "status": "OPEN"
    }

    incidents.append(new_incident)

    # Send notification to Notification Service
    notification_data = {
        "message": f"New incident created: {new_incident['id']} - {new_incident['title']}"
    }

    try:
        req = urllib.request.Request(
            f"{NOTIFICATION_SERVICE_URL}/notify",
            data=json.dumps(notification_data).encode("utf-8"),
            headers={
                "Content-Type": "application/json"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=5) as response:
            notification_response = json.loads(
                response.read().decode("utf-8")
            )

    except Exception as e:
        notification_response = {
            "error": str(e)
        }

    return jsonify({
        "incident": new_incident,
        "notification": notification_response
    }), 201


# Update Incident
@app.route("/incidents/<incident_id>", methods=["PUT"])
def update_incident(incident_id):

    data = request.get_json()

    for incident in incidents:

        if incident["id"] == incident_id:

            if "title" in data:
                incident["title"] = data["title"]

            if "severity" in data:
                incident["severity"] = data["severity"]

            if "status" in data:
                incident["status"] = data["status"]

            return jsonify(incident)

    return jsonify({
        "error": "Incident not found"
    }), 404


# Start Flask Application
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )