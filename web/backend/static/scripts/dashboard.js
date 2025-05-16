let uploadedFiles = [];

// DOM-елементи
const fileInput = document.getElementById("dashboardFiles");
const fileNameDisplay = document.getElementById("fileNamesDisplay");
const mergeLeft = document.getElementById("mergeLeft");
const mergeRight = document.getElementById("mergeRight");
const xAxis = document.getElementById("xAxis");
const yAxis = document.getElementById("yAxis");
const groupBy = document.getElementById("groupBy");
const aggFunc = document.getElementById("aggFunc");
const graphType = document.getElementById("graphType");
const form = document.getElementById("graphForm");

// обробка вибору файлів
fileInput.addEventListener("change", async () => {
    uploadedFiles = Array.from(fileInput.files);
    fileNameDisplay.innerHTML = uploadedFiles.length > 0
      ? uploadedFiles.map(f => `<div>${f.name}</div>`).join("")
      : "No files uploaded";

    const formData = new FormData();
    uploadedFiles.forEach(file => formData.append("files", file));

    const res = await fetch("/get-plot-columns", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    // очищення всіх селектів
    [mergeLeft, mergeRight, xAxis, yAxis, groupBy].forEach(sel => sel.innerHTML = "");

    if (uploadedFiles.length === 1 && data.file1) {
        populateSelect(xAxis, data.file1);
        populateSelect(yAxis, data.file1);
        populateSelect(groupBy, data.file1);
        document.querySelector(".merge-settings").classList.add("hidden");
    } else if (uploadedFiles.length === 2 && data.file1 && data.file2) {
        const labelLeft = document.querySelector('label[for="mergeLeft"]');
        const labelRight = document.querySelector('label[for="mergeRight"]');
        if (labelLeft && labelRight) {
            labelLeft.textContent = `Merge column (${uploadedFiles[0].name})`;
            labelRight.textContent = `Merge column (${uploadedFiles[1].name})`;
        }

        populateSelect(mergeLeft, data.file1);
        populateSelect(mergeRight, data.file2);

        const mergedColumns = [...new Set([...data.file1, ...data.file2])];
        populateSelect(xAxis, mergedColumns);
        populateSelect(yAxis, mergedColumns);
        populateSelect(groupBy, mergedColumns);
        document.querySelector(".merge-settings").classList.remove("hidden");
    }
});

// сабміт форми
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (uploadedFiles.length === 0) return;

    const formData = new FormData();
    uploadedFiles.forEach(file => formData.append("files", file));
    formData.append("merge_left", mergeLeft.value);
    formData.append("merge_right", mergeRight.value);
    formData.append("x_column", xAxis.value);
    formData.append("y_column", yAxis.value);
    formData.append("plot_type", graphType.value);
    formData.append("group_by", groupBy.value);
    formData.append("agg_func", aggFunc.value);

    const res = await fetch("/dashboard-plot", {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        const error = await res.text();
        alert("Error building plot:\n" + error);
        return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const card = document.createElement("div");
    card.classList.add("graph-card");

    const img = document.createElement("img");
    img.src = url;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "❌";
    removeBtn.onclick = () => {
        card.remove();

        const remaining = document.querySelectorAll(".graph-card");
        if (remaining.length === 0) {
            document.getElementById("downloadDashboard").classList.add("hidden");
        }
    };
    const upBtn = document.createElement("button");
    upBtn.textContent = "↑";
    upBtn.className = "move-btn";
    upBtn.onclick = () => {
        const prev = card.previousElementSibling;
        if (prev) card.parentNode.insertBefore(card, prev);
    };

    const downBtn = document.createElement("button");
    downBtn.textContent = "↓";
    downBtn.className = "move-btn";
    downBtn.onclick = () => {
        const next = card.nextElementSibling;
        if (next) card.parentNode.insertBefore(next, card);
    };

    card.appendChild(removeBtn);
    card.appendChild(upBtn);
    card.appendChild(downBtn);
    card.appendChild(img);

    document.getElementById("dashboardGrid").appendChild(card);
    document.getElementById("downloadDashboard").classList.remove("hidden");
});

function populateSelect(selectEl, columns) {
    selectEl.innerHTML = "";
    columns.forEach(col => {
        const opt = new Option(col, col);
        selectEl.appendChild(opt);
    });
}

document.getElementById("downloadDashboard").addEventListener("click", () => {
    const dashboard = document.getElementById("dashboardGrid");
    html2canvas(dashboard).then(canvas => {
        const link = document.createElement("a");
        link.download = "dashboard.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
});
