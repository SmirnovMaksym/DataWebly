document.getElementById('insightsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('insightsFile');
    if (!fileInput.files.length) {
        alert('Please select a file.');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const res = await fetch('/analyze-insights', {
        method: 'POST',
        body: formData
    });

    const data = await res.text();
    document.getElementById('insightsResult').innerHTML = data;
    document.getElementById('downloadPdfBtn').style.display = 'inline-block';
});


document.getElementById('downloadPdfBtn').addEventListener('click', async () => {
    const insightsHtml = document.getElementById('insightsResult').innerHTML;

    const res = await fetch('/download-insights-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: insightsHtml })
    });

    if (!res.ok) {
        alert("PDF generation failed.");
        return;
    }

    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'insights_report.pdf';
    link.click();
});