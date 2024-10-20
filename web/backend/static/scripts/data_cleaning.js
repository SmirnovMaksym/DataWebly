const startProcessButton = document.getElementById('startProcess');
const downloadFileButton = document.getElementById('downloadFile');
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const cleaningForm = document.getElementById('cleaningForm');
const fileNameDisplay = document.getElementById('fileNameDisplay');


startProcessButton.addEventListener('click', () => {
    const formData = new FormData();
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload a file.");
        return;
    }

    formData.append('file', file);

    const selectedFunctions = document.querySelectorAll('input[name="cleaningFunction"]:checked');
    selectedFunctions.forEach((checkbox) => {
        formData.append('cleaningFunction', checkbox.value);
    });

    fetch('/process-data', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // alert('Data cleaning process completed successfully!');
            downloadFileButton.classList.remove('disabled');
            downloadFileButton.disabled = false;

            // Используем только имя файла
            const cleanedFileName = data.cleaned_file_path;
            downloadFileButton.addEventListener('click', () => {
                window.location.href = `/download-cleaned-file/${encodeURIComponent(cleanedFileName)}`;
            });

            updateProgressBar(100); // Прогресс 100%
        } else {
            alert('An error occurred during data cleaning.');
        }
    });
});


function updateProgressBar(percentage) {
    progressBar.style.width = `${percentage}%`;
    progressText.innerText = `${percentage}%`;
}

// Открытие проводника файлов по клику на область
fileDropArea.addEventListener('click', () => {
    fileInput.click();
});

// Обработка событий drag & drop
fileDropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    fileDropArea.classList.add('dragging');
});

fileDropArea.addEventListener('dragleave', () => {
    fileDropArea.classList.remove('dragging');
});

fileDropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    fileDropArea.classList.remove('dragging');

    const file = event.dataTransfer.files[0];
    fileInput.files = event.dataTransfer.files;

    // Обновляем отображение имени файла
    fileNameDisplay.textContent = file.name;
});

// Обработка выбора файла через проводник
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        // Обновляем отображение имени файла
        fileNameDisplay.textContent = file.name;
    } else {
        fileNameDisplay.textContent = 'No file uploaded';
    }
});