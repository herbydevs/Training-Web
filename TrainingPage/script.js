document.getElementById("search-input").addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();  // Get search query
    searchFocalPoints(query);
});

// Function to search through focal points
function searchFocalPoints(query) {
    if (!query) {
        // If search query is empty, display all focal points
        fetchFocalPoints();
        return;
    }

    fetch("http://10.164.8.229:5001/getFocalPoints")
        .then(response => response.json())
        .then(data => {
            const filtered = data.filter(focalPoint => 
                focalPoint["Focal Point"].toLowerCase().includes(query) ||
                focalPoint["Point Person"].toLowerCase().includes(query)
            );
            displayFocalPoints(filtered);
        })
        .catch(error => console.error("Error fetching focal points:", error));
}

// Function to fetch and display all focal points
function fetchFocalPoints() {
    fetch("http://10.164.8.229:5001/getFocalPoints")
        .then(response => response.json())
        .then(data => {
            displayFocalPoints(data);
        })
        .catch(error => console.error("Error fetching focal points:", error));
}

// Function to display focal points in the table
function displayFocalPoints(focalPoints) {
    const tableBody = document.querySelector("#focal-table tbody");
    tableBody.innerHTML = '';  // Clear existing rows

    if (focalPoints.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2">No matching focal points found</td></tr>';
        return;
    }

    focalPoints.forEach(focalPoint => {
        const row = document.createElement("tr");

        const focalPointCell = document.createElement("td");
        focalPointCell.textContent = focalPoint["Focal Point"];
        row.appendChild(focalPointCell);

        const pointPersonCell = document.createElement("td");
        pointPersonCell.textContent = focalPoint["Point Person"];
        row.appendChild(pointPersonCell);

        tableBody.appendChild(row);
    });
}

// Initial load of all focal points
fetchFocalPoints();




document.addEventListener('DOMContentLoaded', function () {
    // Initially hide all pages
    document.querySelectorAll('.content-page').forEach(p => p.style.display = 'none');

    // Show selected page
    window.showPage = function(page) {
        console.log("Switching to:", page);

        // Hide all pages
        document.querySelectorAll('.content-page').forEach(p => p.style.display = 'none');

        // Show the selected page
        const selectedPage = document.getElementById(page);
        if (selectedPage) {
            selectedPage.style.display = 'block';
        }

        // Re-attach event listener for Add Record button when the Focal Points page is displayed
        if (page === 'focal') {
            addRecordBtn = document.getElementById('add-focal-point-button');
            if (addRecordBtn) {
                addRecordBtn.addEventListener('click', addBlankRecord, { once: true });
            }
        }
    };

    window.onload = function() {
        showPage('home');
    };

    // Attach event listeners to sidebar links
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const page = this.getAttribute('href').substring(1);
            showPage(page);
        });
    });

    console.log("Sidebar event listeners attached!");

    // Load focal points data from the server
    function loadFocalPoints() {
        fetch('http://10.164.8.229:5001//get-focal-points')  // Changed to a GET request for the focal points
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch focal points data');
                }
                return response.json(); // Assuming the server sends JSON data
            })
            .then(data => {
                console.log("Focal Points Data:", data); // Log the fetched data
                displayFocalPoints(data); // Display the focal points in the table
            })
            .catch(error => {
                console.error('Error loading focal points:', error);
            });
    }

    // Display focal points in the table
    function displayFocalPoints(data) {
        const tableBody = document.querySelector('#focal-table tbody');
        if (!tableBody) {
            console.error("Error: Table body not found!");
            return;
        }

        tableBody.innerHTML = '';  // Clear previous rows

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="2">No data available</td></tr>';
            return;
        }

        data.forEach(focal => {
            const row = document.createElement('tr');

            const focalPointCell = document.createElement('td');
            focalPointCell.textContent = focal["Focal Point"];
            row.appendChild(focalPointCell);

            const pointPersonCell = document.createElement('td');
            pointPersonCell.textContent = focal["Point Person"];
            row.appendChild(pointPersonCell);

            tableBody.appendChild(row);
        });

        // Force reflow to ensure the table updates correctly
        tableBody.offsetHeight; // This forces a reflow
    }

    // Add a blank record input row
    function addBlankRecord() {
        const tableBody = document.querySelector('#focal-table tbody');

        if (!tableBody) {
            console.error("Error: Table body not found!");
            return;
        }

        const row = document.createElement('tr');

        const focalPointCell = document.createElement('td');
        const focalPointInput = document.createElement('input');
        focalPointInput.type = 'text';
        focalPointInput.placeholder = 'Enter Focal Point';
        focalPointCell.appendChild(focalPointInput);
        row.appendChild(focalPointCell);

        const pointPersonCell = document.createElement('td');
        const pointPersonInput = document.createElement('input');
        pointPersonInput.type = 'text';
        pointPersonInput.placeholder = 'Enter Point Person';
        pointPersonCell.appendChild(pointPersonInput);
        row.appendChild(pointPersonCell);

        tableBody.insertBefore(row, tableBody.firstChild); // Insert at top

        // Listen for Enter key to save data
        focalPointInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && focalPointInput.value !== '' && pointPersonInput.value !== '') {
                addDataToCSV(focalPointInput.value, pointPersonInput.value);
            }
        });

        pointPersonInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && focalPointInput.value !== '' && pointPersonInput.value !== '') {
                addDataToCSV(focalPointInput.value, pointPersonInput.value);
            }
        });
    }

    // Send data to server (Assuming backend handles this)
    function addDataToCSV(focalPoint, pointPerson) {
        fetch('http://10.164.8.229:5001/addFocalPoint', {  
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "Focal Point": focalPoint,
                "Point Person": pointPerson
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error adding record: ' + data.error);
            } else {
                alert('Record added successfully!');
                loadFocalPoints(); // Refresh table
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to add record');
        });
    }


    // Function to parse CSV text into an array of records
    function parseCSV(csvText) {
        const rows = csvText.split('\n');  // Split by newlines to get rows
        const headers = rows[0].split(',');  // Assume first row contains headers
        const records = [];
    
        // Loop through the remaining rows and create an object for each record
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',');
            if (values.length === headers.length) {
                const record = {};
                for (let j = 0; j < headers.length; j++) {
                    record[headers[j].trim()] = values[j].trim();  // Create key-value pairs
                }
                records.push(record);
            }
        }
    
        return records;  // Return the array of parsed records
    }
    

    // Event listeners for switching between pages
    // Initially load focal points and training records when the page is loaded


    



    loadFocalPoints();
});
