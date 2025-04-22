from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import csv
import os
from datetime import datetime

app = Flask(__name__)

# Enable CORS
CORS(app, resources={r"/*": {"origins": "*"}})  # Allows all origins

# Paths
TRAINING_RECORDS_PATH = './Database/'
LOG_FILE_PATH = './Database/logs.txt'
DATABASE_PATH = './Database/LogBook.csv'
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
        return send_from_directory(BOOKING_DIR, filename, as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get Logbook
@app.route('/get-logbook', methods=['GET'])
def get_logbook():
    if not os.path.exists(DATABASE_PATH):
        return jsonify({"error": "Logbook file not found"}), 404

    log_entries = []
    with open(DATABASE_PATH, 'r') as f:
        reader = csv.DictReader(f)
        log_entries = list(reader)

    return jsonify(log_entries)

# Update Logbook Entry
@app.route("/update-logbook", methods=['POST'])
def update_logbook():
    data = request.get_json()
    updated_record = data.get('record')

    if not updated_record:
        return jsonify({"error": "Invalid data"}), 400

    try:
        # Read existing records
        with open(DATABASE_PATH, 'r', newline='') as file:
            reader = csv.DictReader(file)
            records = list(reader)

        # Find and update record
        for record in records:
            if record["Item"] == updated_record["Item"]:  # Assuming "Item" is a unique identifier
                record.update(updated_record)
                break
        else:
            return jsonify({"error": "Record not found"}), 404

        # Write updated records back to file
        with open(DATABASE_PATH, 'w', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
            writer.writeheader()
            writer.writerows(records)

        # Log the action
        client_ip = request.remote_addr
        log_action("update", DATABASE_PATH, f"Updated record: {updated_record}", client_ip)

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get Training Records
@app.route('/get-training-records', methods=['GET'])
def get_training_records():
    file_name = request.args.get('file')
    if not file_name:
        return jsonify({"error": "File name is required"}), 400

    file_path = os.path.join(TRAINING_RECORDS_PATH, file_name)
    if not os.path.exists(file_path):
        return jsonify({"error": f"File '{file_name}' not found or empty"}), 404

    records = []
    with open(file_path, mode='r') as file:
        reader = csv.DictReader(file)
        records = list(reader)

    return jsonify(records), 200

# Add New Entry
@app.route('/add-new-entry', methods=['POST'])
def add_new_entry():
    data = request.get_json()
    new_record = data.get('record')

    if not new_record:
        return jsonify({"error": "Invalid data"}), 400

    try:
        # Read existing records
        records = []
        if os.path.exists(DATABASE_PATH):
            with open(DATABASE_PATH, 'r', newline='') as file:
                reader = csv.DictReader(file)
                records = list(reader)

        # Insert new record at the top
        records.insert(0, new_record)

        # Write back to file
        with open(DATABASE_PATH, 'w', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
            writer.writeheader()
            writer.writerows(records)

        # Log the action
        client_ip = request.remote_addr
        log_action("add", DATABASE_PATH, f"Added new record: {new_record}", client_ip)

        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add Training Record
@app.route('/add-training-record', methods=['POST'])
def add_training_record():
    data = request.get_json()
    file_name = data.get('file')
    new_record = data.get('record')

    if not file_name or not new_record:
        return jsonify({"error": "File and record are required"}), 400

    file_path = os.path.join(TRAINING_RECORDS_PATH, file_name)
    if not os.path.exists(file_path):
        return jsonify({"error": f"File {file_name} does not exist"}), 404

    try:
        with open(file_path, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            existing_records = list(reader)

        existing_records.insert(0, new_record)

        with open(file_path, 'w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=reader.fieldnames)
            writer.writeheader()
            writer.writerows(existing_records)

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
