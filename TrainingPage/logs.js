document.getElementById('add-entry-button').addEventListener('click', function () {
    const newRow = document.createElement("tr");

    const columns = ["Item", "Person", "IN", "Out", "Condition In", "Condition Out", "Notes"];
    columns.forEach(function (col) {
        const newCell = document.createElement("td");
        newCell.contentEditable = true;
        newCell.setAttribute("data-column", col);
        newRow.appendChild(newCell);
    });

    document.querySelector("#LogBook-table tbody").insertBefore(newRow, document.querySelector("#LogBook-table tbody").firstChild);
    newRow.querySelector("td").focus();

    newRow.addEventListener('keydown', function(event) {
        if (event.key === "Enter") {
            const updatedRecord = getRowData(newRow);
            saveNewRecord(updatedRecord);  // Save new record immediately
        }
    });
});

// Consolidated function to extract row data
function getRowData(row) {
    const cells = row.querySelectorAll('td');
    const record = {};
    cells.forEach(cell => {
        record[cell.getAttribute("data-column")] = cell.textContent.trim();
    });
    return record;
}

// Save the new record to the server
function saveNewRecord(updatedRecord) {
    const fileName = 'logbook.csv';

    fetch("http://10.164.8.229:5001/add-new-entry", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            file: fileName,
            record: updatedRecord
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Record added successfully!");
        } else {
            alert("Failed to add the record.");
        }
    })
    .catch(error => console.error("Error saving record:", error));
}

function fetchLogBookData() {
    fetch(" http://10.164.8.229:5001/get-log-book")
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("Error fetching logbook data: " + data.error);
                return;
            }
            displayLogBookData(data);
        })
        .catch(error => console.error("Error fetching logbook data:", error));
}

function displayLogBookData(logEntries) {
    const tableBody = document.querySelector("#LogBook-table tbody");
    tableBody.innerHTML = '';  

    if (logEntries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No log entries found</td></tr>';
        return;
    }

    logEntries.forEach(entry => {
        const row = document.createElement("tr");

        const columns = ["Item", "Person", "Date/Time(Out)", "Date/Time (In)", "Condition (In)", "Condition (Out)", "Notes"];
        columns.forEach(col => {
            const cell = document.createElement("td");
            cell.textContent = entry[col] || '';  // Ensure we handle missing data
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// Edit existing row on click and update when "Enter" is pressed
document.querySelector("#LogBook-table tbody").addEventListener('click', function(event) {
    const cell = event.target;
    const row = cell.closest("tr");

    if (cell.tagName === "TD" && !cell.isContentEditable) {
        cell.contentEditable = true;
        cell.focus();
    }
});

// Handle saving when "Enter" is pressed for editing
document.querySelector("#LogBook-table tbody").addEventListener('keydown', function(event) {
    if (event.key === "Enter" && event.target.tagName === "TD" && event.target.isContentEditable) {
        const updatedRecord = getRowData(event.target.closest('tr'));
        saveUpdatedRecord(updatedRecord);  // Save updated record
    }
});

function saveUpdatedRecord(updatedRecord) {
    const fileName = 'logbook.csv';

    fetch("http://10.164.8.229:5001/update-logbook", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            file: fileName,
            record: updatedRecord
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Record updated successfully!");
        } else {
            alert("Failed to update the record.");
        }
    })
    .catch(error => console.error("Error saving record:", error));
}

// Function to save all changes when the "Save Changes" button is clicked
document.getElementById('save-table-button').addEventListener('click', function () {
    const rows = document.querySelectorAll("#LogBook-table tbody tr");
    const updatedRecords = [];

    rows.forEach(row => {
        const updatedRecord = getRowData(row);
        updatedRecords.push(updatedRecord);
    });

    const fileName = 'logbook.csv';

    fetch("http://10.164.8.229:5001/save-all-changes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            file: fileName,
            records: updatedRecords
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("All changes saved successfully!");
        } else {
            alert("Failed to save changes.");
        }
    })
    .catch(error => console.error("Error saving all records:", error));
});

document.addEventListener("DOMContentLoaded", fetchLogBookData);
