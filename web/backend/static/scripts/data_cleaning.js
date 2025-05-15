// Основні DOM-елементи
const startProcessButton = document.getElementById('startProcess');
const downloadFileButton = document.getElementById('downloadFile');
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const tableContainer = document.getElementById('tableContainer');
let cleanedData = null;

// Обробка натискання кнопки "Start Data Cleaning"
startProcessButton.addEventListener('click', () => {
    const formData = new FormData();
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload a file.");
        return;
    }

    formData.append('file', file);

    // Збір обраних колонок з чекбоксів
    function getCheckedValues(containerId) {
        const container = document.getElementById(containerId);
        return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    }

    const missingCols = getCheckedValues('missingValueColumns');
    missingCols.forEach(col => formData.append('missingValueColumns', col));

    const selectedCols = getCheckedValues('selectedColumns');
    selectedCols.forEach(col => formData.append('selectedColumns', col));

    const dateCols = getCheckedValues('dateColumn');
    dateCols.forEach(col => formData.append('dateColumn', col));

    updateProgressBar(10);

    // Надсилання запиту на очищення даних
    fetch('/process-data', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateProgressBar(100);

            // Відображення обох таблиць
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

// Обробка завантаження очищеного файлу
downloadFileButton.addEventListener('click', () => {
    if (cleanedData) {
        const fileId = cleanedData.file_id;
        const link = document.createElement('a');
        link.href = `/download-cleaned-file/${fileId}`;
        link.click();
    }
});

// Оновлення прогрес-бара
function updateProgressBar(percentage) {
    progressBar.style.width = `${percentage}%`;
    progressText.innerText = `${percentage}%`;
}

// Відображення таблиці з даними
function displayTable(data, title) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('preview-block');

    const tableTitle = document.createElement('h4');
    tableTitle.innerText = title;
    wrapper.appendChild(tableTitle);

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
            td.textContent = value ?? '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    tableContainer.appendChild(wrapper);
}

// 🖱Обробка drag & drop
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

// Обробка вибору файлу через інпут
fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
        handleFileLoad(file);
    }
});

// Завантаження колонок та попереднього перегляду
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

// Заповнення випадаючих списків колонками
function populateColumnSelectors(columns) {
    const config = [
        { id: 'missingValueColumns' },
        { id: 'selectedColumns' },
        { id: 'dateColumn' }
    ];

    config.forEach(({ id }) => {
        const container = document.getElementById(id);
        const content = container.querySelector('.dropdown-content');

        if (!container || !content) return;

        content.innerHTML = '';
        container.classList.remove('hidden');

        columns.forEach(col => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${col}"> ${col}`;
            content.appendChild(label);
        });
    });
}

// Показ/приховування вибору колонок при увімкненні чекбоксів
document.getElementById('detectDuplicates').addEventListener('change', function () {
    document.getElementById('selectedColumns').classList.toggle('hidden', !this.checked);
});

document.getElementById('fixDates').addEventListener('change', function () {
    document.getElementById('dateColumn').classList.toggle('hidden', !this.checked);
});

document.getElementById('removeMissing').addEventListener('change', function () {
    document.getElementById('missingValueColumns').classList.toggle('hidden', !this.checked);
});

// Очистка старої таблиці при кожному завантаженні
tableContainer.innerHTML = '';
