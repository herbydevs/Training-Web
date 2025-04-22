from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import csv
import os
from datetime import datetime

app = Flask(__name__)

# Enable CORS with specific settings
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)


# Paths
TRAINING_RECORDS_PATH = './Database/'
LOG_FILE_PATH = './Database/logs.txt'
DATABASE_PATH = './Database/LogBook.csv'
FOCAL_POINTS_PATH = './Database/Focal_Points.csv'
FIELDNAMES = ["Item", "Person", "Date/Time(Out)", "Date/Time (In)", "Condition (In)", "Condition (Out)", "Notes"]
BOOKING_DIR = "./Booking"

# Ensure directories exist
os.makedirs(TRAINING_RECORDS_PATH, exist_ok=True)
os.makedirs(BOOKING_DIR, exist_ok=True)

# Create log file if it doesn't exist
if not os.path.exists(LOG_FILE_PATH):
    with open(LOG_FILE_PATH, 'w') as log_file:
        log_file.write('Logs initialized.\n')

# Function to log actions
def log_action(action, affected_file, details="", client_info="Unknown Client"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] Action: {action}, File: {affected_file}, Client: {client_info}, Details: {details}\n"
    with open(LOG_FILE_PATH, 'a') as log_file:
        log_file.write(log_entry)

# Helper function to read CSV files
def read_csv(file_path):
    if not os.path.exists(file_path):
        return None, f"File '{file_path}' not found"
    try:
        with open(file_path, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            return list(reader), None
    except Exception as e:
        return None, str(e)

# Helper function to write to CSV files
def write_csv(file_path, fieldnames, data):
    try:
        with open(file_path, 'w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        return True, None
    except Exception as e:
        return False, str(e)

# Handle CORS Preflight Requests
@app.route("/save-all-changes", methods=["OPTIONS"])
def handle_options():
    response = jsonify({"message": "CORS preflight passed"})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    return response, 200

# Upload Booking PDF
@app.route("/upload-booking", methods=["POST"])
def upload_booking():
    if "pdf" not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    file = request.files["pdf"]
    if file.filename == "":
        return jsonify({"success": False, "error": "No selected file"}), 400

    file_path = os.path.join(BOOKING_DIR, file.filename)
    file.save(file_path)
    return jsonify({"success": True, "message": "File uploaded successfully", "file": file.filename})

# List Booking Files
@app.route("/list-files", methods=["GET"])
def list_files():
    try:
        files = os.listdir(BOOKING_DIR)
        return jsonify(files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Download Booking File
@app.route("/download/<filename>", methods=["GET"])
def download_file(filename):
    try:
        file_path = os.path.join(BOOKING_DIR, filename)
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404
        return send_from_directory(BOOKING_DIR, filename, as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get Logbook
@app.route('/get-log-book', methods=['GET'])
def get_logbook():
    log_entries, error = read_csv(DATABASE_PATH)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(log_entries)

# Update Logbook Entry
@app.route("/update-logbook", methods=['POST'])
def update_logbook():
    data = request.get_json()
    updated_record = data.get('record')

    if not updated_record:
        return jsonify({"error": "Invalid data"}), 400

    log_entries, error = read_csv(DATABASE_PATH)
    if error:
        return jsonify({"error": error}), 404

    for record in log_entries:
        if record["Item"] == updated_record["Item"]:
            record.update(updated_record)
            break
    else:
        return jsonify({"error": "Record not found"}), 404

    success, error = write_csv(DATABASE_PATH, FIELDNAMES, log_entries)
    if success:
        log_action("update", DATABASE_PATH, f"Updated record: {updated_record}", request.remote_addr)
        return jsonify({"success": True}), 200
    return jsonify({"error": error}), 500

# Get Focal Points
@app.route('/get-focal-points', methods=['GET'])
def get_focal_points():
    focal_points, error = read_csv(FOCAL_POINTS_PATH)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(focal_points)

# Get Training Records
@app.route('/get-training-records', methods=['GET'])
def get_training_records():
    file_name = request.args.get('file')
    if not file_name:
        return jsonify({"error": "File name is required"}), 400

    file_path = os.path.join(TRAINING_RECORDS_PATH, file_name)
    training_records, error = read_csv(file_path)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(training_records), 200

# Add New Entry
import traceback

@app.route('/add-training-record', methods=['POST'])
def add_training_record():
    try:
        data = request.get_json()
        print("Received data:", data)  # Log request data for debugging

        file_name = data.get("file")
        record = data.get("record")

        if not file_name or not record:
            return jsonify({"error": "Missing file or record"}), 400

        # Add your logic to append the record to the CSV file
        with open(f"./Booking/{file_name}", "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(record.values())

        return jsonify({"success": True})

    except Exception as e:
        print("Error adding training record:", e)
        traceback.print_exc()  # Show full error traceback
        return jsonify({"error": str(e)}), 500


@app.route('/addFocalPoint', methods=["POST"])
def add_focal_point():
    if request.method == 'OPTIONS':
        # Respond to the preflight request
        response = jsonify({'message': 'CORS preflight successful'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200

    # Handle POST request
    data = request.get_json()
    
    if not data or "Focal Point" not in data or "Point Person" not in data:
        return jsonify({"error": "Invalid data"}), 400

    new_entry = {"Focal Point": data["Focal Point"], "Point Person": data["Point Person"]}

    # Read existing focal points
    focal_points = []
    file_exists = os.path.exists(FOCAL_POINTS_PATH)
    
    if file_exists:
        with open(FOCAL_POINTS_PATH, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            focal_points = list(reader)

    # Append new entry to the list
    focal_points.append(new_entry)

    # Write back to file
    with open(FOCAL_POINTS_PATH, mode='w', newline='', encoding='utf-8') as file:
        fieldnames = ["Focal Point", "Point Person"]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(focal_points)

    return jsonify({"success": True, "message": "Focal point added!"}), 200



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
