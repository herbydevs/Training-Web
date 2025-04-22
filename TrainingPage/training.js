let currentTrainingFile = ''; // Ensure this is declared at the beginning

 // Update currentTrainingFile when a user selects a time period from the dropdown
 document.getElementById("time-period-selector").addEventListener("change", function (e) {
     currentTrainingFile = e.target.value; // Set the selected file name to currentTrainingFile
     console.log("Selected file:", currentTrainingFile); // For debugging
 });

document.addEventListener('DOMContentLoaded', function () {
    console.log("JavaScript loaded successfully");




        // Available training record files
        
        const trainingFiles = ["2024-2025.csv", "2022-2023.csv", "2020-2021.csv","2018-2019.csv","2016-2017.csv", "2014-2015.csv", "2012-2013.csv"];  // Add more as needed

        // Attach event listener to search box
        const searchBox = document.getElementById('training-search-box');
        if (searchBox) {
            searchBox.addEventListener('input', function () {
                searchTrainingRecords(this.value);
            });
        }
    
        // Function to search all training records
        function searchTrainingRecords(query) {
            if (!query.trim()) return;  // Ignore empty queries
            
            const searchTerms = query.split(',').map(term => term.trim().toLowerCase()).filter(term => term); // Split, trim, and filter out empty terms
            const searchResults = [];
        
            // Fetch and search each file
            const searchPromises = trainingFiles.map(file => {
                return fetch(`http://10.164.8.229:5001/get-training-records?file=${file}`)
                    .then(response => response.json())
                    .then(data => {
                        const filtered = data.filter(record => 
                            searchTerms.some(term => 
                                Object.values(record).some(value => 
                                    value.toString().toLowerCase().includes(term)
                                )
                            )
                        );
                        searchResults.push(...filtered);
                    })
                    .catch(error => console.error(`Error searching ${file}:`, error));
            });
        
            // Wait for all searches to complete, then display results
            Promise.all(searchPromises).then(() => displayTrainingRecords(searchResults));
        }
    


    // Attach event listener to the time period dropdown
 
    const yearPeriodSelect = document.getElementById('year-period');
    if (yearPeriodSelect) {
        yearPeriodSelect.addEventListener('change', function () {
            const fileName = this.value;
            console.log("Selected file:", fileName);
            currentTrainingFile = this.value; // Store the selected file
            if (fileName) {
                window.loadTrainingRecords(fileName); // ✅ Ensure it's globally accessible
            }
        });
    } else {
        console.warn("Dropdown not found");
    }
});

// ✅ Define function globally so it's accessible
window.loadTrainingRecords = function (fileName) {
    if (!fileName) {
        console.warn("No file selected");
        return;
    }
    const url = `http://10.164.8.229:5001/get-training-records?file=${fileName}.csv`;
    console.log("Fetching URL:", url);
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load training records');
            }
            return response.json();
        })
        .then(data => {
            console.log("Received data:", data);
            displayTrainingRecords(data);
        })
        .catch(error => {
            console.error('Error loading training records:', error);
        });
};

// ✅ Define `displayTrainingRecords` globally too
window.displayTrainingRecords = function (records) {
    const tableBody = document.querySelector('#training-records-table tbody');
    tableBody.innerHTML = '';  // Clear existing rows before adding new ones

    if (records.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No records found</td></tr>';
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');

        const refNoCell = document.createElement('td');
        refNoCell.textContent = record["REF. NO"];
        row.appendChild(refNoCell);

        const yearCell = document.createElement('td');
        yearCell.textContent = record["YEAR"];
        row.appendChild(yearCell);

        const nameCell = document.createElement('td');
        nameCell.textContent = record["NAME OF CAPACITY BUILDING"];
        row.appendChild(nameCell);

        const dateCell = document.createElement('td');
        dateCell.textContent = record["DATE"];
        row.appendChild(dateCell);

        const typeCell = document.createElement('td');
        typeCell.textContent = record["TYPE"];
        row.appendChild(typeCell);

        const locationCell = document.createElement('td');
        locationCell.textContent = record["LOCATION"];
        row.appendChild(locationCell);

        const participantsCell = document.createElement('td');
        participantsCell.textContent = record["PARTICIPANTS"];
        row.appendChild(participantsCell);

        const areasOfTrainingCell = document.createElement('td');
        areasOfTrainingCell.textContent = record["AREAS OF TRAINING"] || '';  // Add the new field, defaulting to empty if missing
        row.appendChild(areasOfTrainingCell);

        tableBody.appendChild(row);
    });
};
 // Global variable to track the selected file

 

 document.getElementById("add-training-record-button").addEventListener("click", function () {
    if (!currentTrainingFile) {
        alert("Please select a training period first.");
        return;
    }

    // Create a new row with input fields in each cell at the top of the table
    const tableBody = document.querySelector("#training-records-table tbody");

    const row = document.createElement("tr");

    // Create editable cells
    const cells = [
        "REF. NO",
        "YEAR",
        "NAME OF CAPACITY BUILDING",
        "DATE",
        "TYPE",
        "LOCATION",
        "PARTICIPANTS",
        "AREAS OF TRAINING"
    ];

    cells.forEach(cell => {
        const cellElement = document.createElement("td");
        const inputElement = document.createElement("input");
        inputElement.type = cell === "DATE" ? "text" : "text";  // Date field for the "DATE" column
        inputElement.placeholder = `Enter ${cell}`;
        cellElement.appendChild(inputElement);
        row.appendChild(cellElement);
    });

    // Add a "Save" button in the last cell to save the data
    const saveCell = document.createElement("td");
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", function () {
        const newRecord = {};
        let valid = true;

        // Collect data from input fields
        row.querySelectorAll("td input").forEach((input, index) => {
            const cellName = cells[index];  // Get the cell name
            if (!input.value.trim()) {
                alert(`${cellName} is required!`);
                valid = false;
                return;
            }
            newRecord[cellName] = input.value.trim();
        });

        if (valid) {
            // Ensure the file name has a .csv extension
            const fileNameWithExtension = currentTrainingFile.endsWith('.csv') ? currentTrainingFile : currentTrainingFile + '.csv';
        
            // Send to backend to save the new record
            fetch("http://10.164.8.229:5001/add-training-record", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ file: fileNameWithExtension, record: newRecord })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Record added successfully!");
                    // Add the new record to the table visually
                    const newRow = document.createElement("tr");
                    Object.values(newRecord).forEach(value => {
                        const newCell = document.createElement("td");
                        newCell.textContent = value;
                        newRow.appendChild(newCell);
                    });
                    // Add the save button to the row if needed
                    newRow.appendChild(saveCell);
                    tableBody.insertBefore(newRow, tableBody.firstChild);  // Insert at the top
                } else {
                    alert("Failed to add record.");
                }
            })
            .catch(error => console.error("Error:", error));
        }
        
    });

    saveCell.appendChild(saveButton);
    row.appendChild(saveCell);
    tableBody.insertBefore(row, tableBody.firstChild);  // Insert at the top of the table
});





