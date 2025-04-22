document.addEventListener("DOMContentLoaded", fetchFiles);

function fetchFiles() {
    fetch("http://10.164.8.229:5001/list-files")
        .then(response => response.json())
        .then(data => displayFiles(data))
        .catch(error => console.error("Error loading files:", error));
}

function displayFiles(files) {
    const fileListDiv = document.getElementById("file-list");
    fileListDiv.innerHTML = ""; // Clear previous content

    if (files.length === 0) {
        fileListDiv.innerHTML = "<p>No files found.</p>";
        return;
    }

    files.forEach(file => {
        const fileDiv = document.createElement("div");s
        fileDiv.classList.add("file-item");

        const fileLink = document.createElement("a");
        fileLink.href = `http://10.164.8.229:5001/download/${file}`;
        fileLink.textContent = file;
        fileLink.setAttribute("download", file); // Make it downloadable

        fileDiv.appendChild(fileLink);
        fileListDiv.appendChild(fileDiv);
    });
}
