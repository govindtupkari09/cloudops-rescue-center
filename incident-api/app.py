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
        "description": "Main company website is unavailable.",
        "severity": "HIGH",
        "category": "APPLICATION",
        "status": "OPEN",
        "created_by": "System Admin",
        "created_by_email": "admin@example.com"
    },
    {
        "id": "INC002",
        "title": "Database Error",
        "description": "Database connection errors reported.",
        "severity": "MEDIUM",
        "category": "DATABASE",
        "status": "OPEN",
        "created_by": "System Admin",
        "created_by_email": "admin@example.com"
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

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    required_fields = [
        "title",
        "severity",
        "created_by",
        "created_by_email"
    ]

    missing_fields = [
        field for field in required_fields
        if not data.get(field)
    ]

    if missing_fields:
        return jsonify({
            "error": "Required fields are missing",
            "missing_fields": missing_fields
        }), 400

    allowed_severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    severity = str(data["severity"]).upper()

    if severity not in allowed_severities:
        return jsonify({
            "error": "Invalid severity",
            "allowed_values": allowed_severities
        }), 400

    new_incident = {
        "id": f"INC{len(incidents) + 1:03d}",
        "title": str(data["title"]).strip(),
        "description": str(data.get("description", "")).strip(),
        "severity": severity,
        "category": str(data.get("category", "OTHER")).strip().upper(),
        "status": "OPEN",
        "created_by": str(data["created_by"]).strip(),
        "created_by_email": str(data["created_by_email"]).strip()
    }

    incidents.append(new_incident)

    # Send notification to Notification Service
    notification_data = {
        "message": (
            f"New incident created: "
            f"{new_incident['id']} - {new_incident['title']}"
        ),
        "incident_id": new_incident["id"],
        "title": new_incident["title"],
        "severity": new_incident["severity"],
        "created_by": new_incident["created_by"],
        "created_by_email": new_incident["created_by_email"]
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

    except Exception:
        notification_response = {
            "status": "notification failed"
        }

    return jsonify({
        "incident": new_incident,
        "notification": notification_response
    }), 201


# Update Incident
@app.route("/incidents/<incident_id>", methods=["PUT"])
def update_incident(incident_id):

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    for incident in incidents:

        if incident["id"] == incident_id:

            if "title" in data:
                incident["title"] = data["title"]

            if "description" in data:
                incident["description"] = data["description"]

            if "severity" in data:
                severity = str(data["severity"]).upper()

                allowed_severities = [
                    "LOW",
                    "MEDIUM",
                    "HIGH",
                    "CRITICAL"
                ]

                if severity not in allowed_severities:
                    return jsonify({
                        "error": "Invalid severity",
                        "allowed_values": allowed_severities
                    }), 400

                incident["severity"] = severity

            if "category" in data:
                incident["category"] = str(data["category"]).strip().upper()

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
