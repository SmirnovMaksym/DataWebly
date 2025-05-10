const startProcessButton = document.getElementById('startProcess');
const downloadFileButton = document.getElementById('downloadFile');
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const tableContainer = document.getElementById('tableContainer');
let cleanedData = null;

// Обработчик кнопки запуска очистки
startProcessButton.addEventListener('click', () => {
    const formData = new FormData();
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload a file.");
        return;
    }

    formData.append('file', file);

    // Считываем выбранные значения
    const missingCols = Array.from(document.getElementById('missingValueColumns').selectedOptions).map(opt => opt.value);
    missingCols.forEach(col => formData.append('missingValueColumns', col));

    const selectedCols = Array.from(document.getElementById('selectedColumns').selectedOptions).map(opt => opt.value);
    selectedCols.forEach(col => formData.append('selectedColumns', col));

    const dateCols = Array.from(document.getElementById('dateColumn').selectedOptions).map(opt => opt.value);
    dateCols.forEach(col => formData.append('dateColumn', col));


    updateProgressBar(10);

    fetch('/process-data', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateProgressBar(100);
            displayTable(data.preview, 'Original Data Preview');
            displayTable(data.cleaned_preview, 'Cleaned Data Preview');
            cleanedData = data;
            downloadFileButton.disabled = false;
            downloadFileButton.classList.remove('disabled');
        } else {
            alert('An error occurred during data cleaning.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Обработчик скачивания
downloadFileButton.addEventListener('click', () => {
    if (cleanedData) {
        const fileId = cleanedData.file_id;
        const link = document.createElement('a');
        link.href = `/download-cleaned-file/${fileId}`;
        link.click();
    }
});

// Функция обновления прогресс-бара
function updateProgressBar(percentage) {
    progressBar.style.width = `${percentage}%`;
    progressText.innerText = `${percentage}%`;
}

// Показывает таблицу
function displayTable(data, title) {
    tableContainer.innerHTML = ''; // очищаем таблицу при каждом запуске

    const tableTitle = document.createElement('h4');
    tableTitle.innerText = title;
    tableContainer.appendChild(tableTitle);

    const table = document.createElement('table');
    table.classList.add('data-table');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    Object.keys(data[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value !== null && value !== undefined ? value : '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    tableContainer.appendChild(table);
}

// Обработчики drag & drop
const fileDropArea = document.getElementById('fileDropArea');
const fileNameDisplay = document.getElementById('fileNameDisplay');

fileDropArea.addEventListener('click', () => {
    fileInput.click();
});

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
    fileNameDisplay.textContent = file.name;
    handleFileLoad(file);
});

// Обработка выбора файла через input
fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
        handleFileLoad(file);
    }
});

// Загрузка колонок с сервера
async function handleFileLoad(file) {
    const selectedColumns = document.getElementById('selectedColumns');
    const dateColumn = document.getElementById('dateColumn');

    selectedColumns.innerHTML = '';
    dateColumn.innerHTML = '';
    selectedColumns.classList.add('hidden');
    dateColumn.classList.add('hidden');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/preview-columns', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            console.error('Error fetching columns');
            return;
        }

        const data = await response.json();
        if (data.columns && data.columns.length > 0) {
            populateColumnSelectors(data.columns);
        } else {
            console.warn('No columns received from server.');
        }
    } catch (error) {
        console.error('Error loading columns:', error);
    }

    try {
        const previewForm = new FormData();
        previewForm.append('file', file);
        const previewRes = await fetch('/preview-data', {
            method: 'POST',
            body: previewForm,
        });

        if (previewRes.ok) {
            const previewData = await previewRes.json();
            if (previewData.preview && previewData.preview.length > 0) {
                displayTable(previewData.preview, 'File Preview');
            }
        } else {
            console.warn('Could not fetch preview data.');
        }
    } catch (err) {
        console.error('Preview error:', err);
    }
}

// Заполняем селекты колонками
function populateColumnSelectors(columns) {
    const selectedColumns = document.getElementById('selectedColumns');
    const dateColumn = document.getElementById('dateColumn');
    const missingValueColumns = document.getElementById('missingValueColumns');

    // Очистка перед заполнением
    selectedColumns.innerHTML = '';
    dateColumn.innerHTML = '';
    missingValueColumns.innerHTML = '';

     columns.forEach(col => {
        const opt1 = new Option(col, col);
        missingValueColumns.appendChild(opt1);

        const opt2 = new Option(col, col);
        selectedColumns.appendChild(opt2);

        const opt3 = new Option(col, col);
        dateColumn.appendChild(opt3);
    });


    // Показать селекты, когда файл загружен
    selectedColumns.classList.remove('hidden');
    dateColumn.classList.remove('hidden');
    missingValueColumns.classList.remove('hidden');
}

// Показывать/скрывать селекты при выборе чекбоксов
document.getElementById('detectDuplicates').addEventListener('change', function () {
    document.getElementById('selectedColumns').classList.toggle('hidden', !this.checked);
});

document.getElementById('fixDates').addEventListener('change', function () {
    document.getElementById('dateColumn').classList.toggle('hidden', !this.checked);
});

document.getElementById('removeMissing').addEventListener('change', function () {
    document.getElementById('missingValueColumns').classList.toggle('hidden', !this.checked);
});



// Очистка таблицы при загрузке новой
tableContainer.innerHTML = '';
