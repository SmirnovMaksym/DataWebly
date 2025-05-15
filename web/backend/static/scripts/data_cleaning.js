// основні елементи
const startProcessButton = document.getElementById('startProcess');
const downloadFileButton = document.getElementById('downloadFile');
const fileInput = document.getElementById('fileInput');
const tableContainer = document.getElementById('tableContainer');
const progressBar = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

let cleanedData = null;

// функція оновлення прогрес-бара
function updateProgressBar(percent) {
    progressBar.style.width = percent + '%';
    progressText.textContent = percent + '%';
}

// функція відображення таблиці
function displayTable(data, title, id = '') {
    if (!data || data.length === 0) return;

    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const block = document.createElement('div');
    block.classList.add('preview-block');
    if (id) block.id = id;

    const heading = document.createElement('h4');
    heading.textContent = title;
    block.appendChild(heading);

    const table = document.createElement('table');
    table.classList.add('data-table');

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    Object.keys(data[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(val => {
            const td = document.createElement('td');
            td.textContent = val ?? '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    block.appendChild(table);
    tableContainer.appendChild(block);
}

// обробка вибору/завантаження файлу
fileInput.addEventListener('change', e => loadFile(e.target.files[0]));

const fileDropArea = document.getElementById('fileDropArea');
fileDropArea.addEventListener('click', () => fileInput.click());
fileDropArea.addEventListener('dragover', e => {
    e.preventDefault();
    fileDropArea.classList.add('dragging');
});
fileDropArea.addEventListener('dragleave', () => fileDropArea.classList.remove('dragging'));
fileDropArea.addEventListener('drop', e => {
    e.preventDefault();
    fileDropArea.classList.remove('dragging');
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
});

// завантаження колонок і попереднього перегляду
async function loadFile(file) {
    if (!file) return;
    document.getElementById('fileNameDisplay').textContent = file.name;

    const formData = new FormData();
    formData.append('file', file);

    const columnsRes = await fetch('/preview-columns', { method: 'POST', body: formData });
    const columnsData = await columnsRes.json();
    populateColumnDropdowns(columnsData.columns);

    const previewRes = await fetch('/preview-data', { method: 'POST', body: formData });
    const previewData = await previewRes.json();
    tableContainer.innerHTML = '';
    displayTable(previewData.preview, 'Попередній перегляд', 'initialPreview');
}

// заповнення випадаючих списків колонок
function populateColumnDropdowns(columns) {
    ['missingValueColumns', 'selectedColumns', 'dateColumn'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;

        const content = container.querySelector('.dropdown-content');
        content.innerHTML = '';
        columns.forEach(col => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${col}"> ${col}`;
            content.appendChild(label);
        });
        container.classList.remove('hidden');
    });
}

// зчитування обраних колонок
function getCheckedValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
}

// запуск очищення даних
startProcessButton.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) return alert('Будь ласка, завантажте файл.');

    const formData = new FormData();
    formData.append('file', file);

    document.querySelectorAll('input[name="cleaningFunction"]:checked').forEach(cb => {
        formData.append('cleaningFunction', cb.value);
    });

    getCheckedValues('selectedColumns').forEach(val => formData.append('selectedColumns[]', val));
    getCheckedValues('dateColumn').forEach(val => formData.append('dateColumn[]', val));
    getCheckedValues('missingValueColumns').forEach(val => formData.append('missingValueColumns[]', val));

    updateProgressBar(10);

    fetch('/process-data', {
        method: 'POST',
        body: formData
    }).then(res => res.json()).then(data => {
        if (data.status === 'success') {
            updateProgressBar(100);
            displayTable(data.cleaned_preview, 'Очищені дані', 'cleanedPreview');
            cleanedData = data;
            downloadFileButton.disabled = false;
            downloadFileButton.classList.remove('disabled');
        } else {
            alert('Помилка під час очищення даних.');
        }
    }).catch(err => console.error('Помилка:', err));
});

// завантаження очищеного файлу
downloadFileButton.addEventListener('click', () => {
    if (cleanedData && cleanedData.file_id) {
        const a = document.createElement('a');
        a.href = `/download-cleaned-file/${cleanedData.file_id}`;
        a.click();
    }
});

// показ/приховування dropdown'ів при виборі функцій
['detectDuplicates', 'removeMissing', 'fixDates'].forEach(id => {
    document.getElementById(id).addEventListener('change', function () {
        const blockMap = {
            detectDuplicates: 'selectedColumns',
            removeMissing: 'missingValueColumns',
            fixDates: 'dateColumn'
        };
        const container = document.getElementById(blockMap[this.id]);
        if (container) container.classList.toggle('hidden', !this.checked);
    });
});
