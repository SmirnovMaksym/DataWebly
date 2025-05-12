const plotFileInput = document.getElementById('plotFileInput');
const plotFileNameDisplay = document.getElementById('plotFileNameDisplay');
const buildPlotButton = document.getElementById('buildPlot');
const mergeLeft = document.getElementById('mergeLeft');
const mergeRight = document.getElementById('mergeRight');
const xColumn = document.getElementById('xColumn');
const yColumn = document.getElementById('yColumn');
const plotType = document.getElementById('plotType');
const plotTitle = document.getElementById('plotTitle');
const plotImage = document.getElementById('plotImage');
const mergeLabel1 = document.getElementById('mergeLabel1');
const mergeLabel2 = document.getElementById('mergeLabel2');

let uploadedFiles = [];

plotFileInput.addEventListener('change', async () => {
    // Сброс — скрываем всё
    [mergeLeft, mergeRight, mergeLabel1, mergeLabel2, xColumn, yColumn, plotType, plotTitle].forEach(el => {
        if (el) el.classList.add('hidden');
    });

    uploadedFiles = Array.from(plotFileInput.files);


    // Сброс предпросмотров
    document.getElementById('filePreviewTable1').innerHTML = '';
    document.getElementById('filePreviewTable2').innerHTML = '';

    // Загрузить предпросмотр каждого файла
    uploadedFiles.forEach(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/preview-data', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (data.preview) {
            const target = index === 0
                ? document.getElementById('filePreviewTable1')
                : document.getElementById('filePreviewTable2');
            renderPreviewTable(target, data.preview);
        }
    });

    function renderPreviewTable(container, rows) {
        if (!rows.length) {
            container.innerHTML = '<p style="color: #aaa;">Empty file</p>';
            return;
        }

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        Object.keys(rows[0]).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        rows.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(val => {
                const td = document.createElement('td');
                td.textContent = val !== null && val !== undefined ? val : '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    }

    plotFileNameDisplay.textContent = uploadedFiles.length > 0
        ? uploadedFiles.map(f => f.name).join(', ')
        : 'No files uploaded';

    if (uploadedFiles.length === 0) return;

    const formData = new FormData();
    uploadedFiles.forEach(file => formData.append('files', file));

    const res = await fetch('/get-plot-columns', {
        method: 'POST',
        body: formData
    });

    const data = await res.json();

    if (uploadedFiles.length === 1 && data.file1) {
        populateSelect(xColumn, data.file1);
        populateSelect(yColumn, data.file1);
        [xColumn, yColumn, plotType, plotTitle].forEach(el => el.classList.remove('hidden'));

        mergeLeft.classList.add('hidden');
        mergeRight.classList.add('hidden');
        mergeLabel1.classList.add('hidden');
        mergeLabel2.classList.add('hidden');
    } else if (data.file1 && data.file2) {
        populateSelect(mergeLeft, data.file1);
        populateSelect(mergeRight, data.file2);
        populateSelect(xColumn, [...new Set([...data.file1, ...data.file2])]);
        populateSelect(yColumn, [...new Set([...data.file1, ...data.file2])]);

        [mergeLeft, mergeRight, mergeLabel1, mergeLabel2, xColumn, yColumn, plotType, plotTitle].forEach(el => el.classList.remove('hidden'));

        // Обновить названия файлов в лейблах
        mergeLabel1.textContent = `Merge on column (${uploadedFiles[0].name})`;
        mergeLabel2.textContent = `Merge on column (${uploadedFiles[1].name})`;
    }
});

function populateSelect(selectEl, columns) {
    selectEl.innerHTML = '';
    columns.forEach(col => {
        const opt = new Option(col, col);
        selectEl.appendChild(opt);
    });
}

buildPlotButton.addEventListener('click', async () => {
    if (uploadedFiles.length === 0) {
        alert("Please upload at least one file");
        return;
    }

    if (!plotTitle.value) {
    plotTitle.value = `${xColumn.value} vs ${yColumn.value}`;
    }

    const formData = new FormData();
    uploadedFiles.forEach(file => formData.append('files', file));
    formData.append('merge_left', mergeLeft.value);
    formData.append('merge_right', mergeRight.value);
    formData.append('x_column', xColumn.value);
    formData.append('y_column', yColumn.value);
    formData.append('plot_type', plotType.value);
    formData.append('plot_title', plotTitle.value);

    const res = await fetch('/build-plot', {
        method: 'POST',
        body: formData
    });

    if (res.ok) {
        const blob = await res.blob();
        plotImage.src = URL.createObjectURL(blob);
        plotImage.style.display = 'block';
        document.getElementById('downloadButtons').style.display = 'block';
    } else {
        alert("Failed to build plot.");
    }
});


function downloadPlot(format) {
    if (!plotImage.src) return;

    const link = document.createElement('a');
    link.href = plotImage.src;
    link.download = `plot.${format}`;
    link.click();
}