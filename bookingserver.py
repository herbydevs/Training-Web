from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Define your booking directory
BOOKING_DIR = "./Booking"  # Make sure to adjust this path as needed

@app.route("/upload-bookings", methods=["POST"])
def upload_booking():
    if "pdf" not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    file = request.files["pdf"]
    if file.filename == "":
        return jsonify({"success": False, "error": "No selected file"}), 400

    # Ensure the booking directory exists
    if not os.path.exists(BOOKING_DIR):
        os.makedirs(BOOKING_DIR)

    # Save the file
    file_path = os.path.join(BOOKING_DIR, file.filename)
    file.save(file_path)

    return jsonify({"success": True, "message": "File uploaded successfully", "file": file.filename})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)
