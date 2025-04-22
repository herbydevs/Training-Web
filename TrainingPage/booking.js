document.getElementById("submit").addEventListener("click", function (event) {
    event.preventDefault(); // Prevent form submission
    generatePDF();
});

document.getElementById("upload").addEventListener("click", function (event) {
    event.preventDefault(); // Prevent form submission
    generatePDF(true);
});

function generatePDF(upload = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const formData = {
        "Name": document.getElementById("name").value,
        "Date": document.getElementById("date").value,
        "Date Reserved": document.getElementById("date-reserved").value,
        "Reason for Booking": document.getElementById("reason").value,
        "Time (Duration)": document.getElementById("time").value,
        "Number of Persons": document.getElementById("num-persons").value,
        "Required Equipment": document.getElementById("required-equipment").value,
        "Catering Required": document.getElementById("catering").checked ? "Yes" : "No",
        "Additional Requirements": document.getElementById("additional-requirements").value,
        "In-House Activity": document.getElementById("in-house").checked ? "Yes" : "No",
        "Hosting Activity": document.getElementById("hosting").checked ? "Yes" : "No"
    };

    let y = 10; // Vertical position in the PDF
    doc.setFontSize(12);
    doc.text("Booking Form", 10, y);
    y += 10;

    for (let key in formData) {
        doc.text(`${key}: ${formData[key]}`, 10, y);
        y += 10;
    }

    const pdfFileName = `Booking_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.pdf`;

    if (upload) {
        // Convert PDF to Blob and send to server
        const pdfBlob = doc.output("blob");

        const formData = new FormData();
        formData.append("pdf", pdfBlob, pdfFileName);

        fetch("http://10.164.8.229:5002/upload-bookings", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("PDF uploaded successfully!");
            } else {
                alert("Failed to upload PDF.");
            }
        })
        .catch(error => console.error("Upload error:", error));
    } else {
        // Save locally
        doc.save(pdfFileName);
    }
}
