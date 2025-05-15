// Обробка відправки форми для отримання аналітики
document.getElementById('insightsForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Зупиняємо стандартну поведінку форми (перезавантаження)

    const fileInput = document.getElementById('insightsFile');
    if (!fileInput.files.length) {
        alert('Please select a file.');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    // Надсилаємо файл на сервер для аналізу
    const res = await fetch('/analyze-insights', {
        method: 'POST',
        body: formData
    });

    // Отримуємо HTML-відповідь з результатами аналізу
    const data = await res.text();
    document.getElementById('insightsResult').innerHTML = data;

    // Робимо кнопку "Download PDF" видимою
    document.getElementById('downloadPdfBtn').style.display = 'inline-block';
});


// Обробка натискання на кнопку "Download PDF"
document.getElementById('downloadPdfBtn').addEventListener('click', async () => {
    const insightsHtml = document.getElementById('insightsResult').innerHTML;

    // Надсилаємо HTML-аналітики на сервер для генерації PDF
    const res = await fetch('/download-insights-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: insightsHtml })
    });

    if (!res.ok) {
        alert("PDF generation failed.");
        return;
    }

    // Отримуємо PDF як blob і запускаємо завантаження
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'insights_report.pdf';
    link.click();
});
