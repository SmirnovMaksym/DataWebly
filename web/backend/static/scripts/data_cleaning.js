const startProcessButton = document.getElementById('startProcess');
const downloadFileButton = document.getElementById('downloadFile');
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const cleaningForm = document.getElementById('cleaningForm');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const tableContainer = document.getElementById('tableContainer'); // Контейнер для таблицы


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
            alert('Data cleaning process completed successfully!');
            displayTable(data.data);  // Отображаем данные в таблице
        } else {
            alert('An error occurred during data cleaning.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Функция для отображения данных в таблице
function displayTable(data) {
    // Очищаем контейнер перед обновлением
    tableContainer.innerHTML = '';

    if (!data || data.length === 0) {
        tableContainer.innerHTML = '<p>No data to display</p>';
        return;
    }

    // Создаем таблицу
    const table = document.createElement('table');
    table.classList.add('data-table');

    // Добавляем заголовок таблицы (на основе ключей первого объекта)
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    Object.keys(data[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Добавляем строки данных
    const tbody = document.createElement('tbody');
    data.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value !== null ? value : '';  // Проверяем на null, чтобы не отображать "null"
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Добавляем таблицу в контейнер
    tableContainer.appendChild(table);
}


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


