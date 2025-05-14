let currentData = null;

document.getElementById("dashboardFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/dashboard-parse", {
        method: "POST",
        body: formData
    });

    const json = await res.json();
    currentData = json.data;

    const columns = json.columns;
    const xAxis = document.getElementById("xAxis");
    const yAxis = document.getElementById("yAxis");

    xAxis.innerHTML = "";
    yAxis.innerHTML = "";

    columns.forEach(col => {
        const opt1 = new Option(col, col);
        const opt2 = new Option(col, col);
        xAxis.appendChild(opt1);
        yAxis.appendChild(opt2);
    });
});

document.getElementById("graphForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const type = document.getElementById("graphType").value;
    const x = document.getElementById("xAxis").value;
    const y = document.getElementById("yAxis").value;

    const res = await fetch("/dashboard-plot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type: type,
            x: x,
            y: y,
            data: currentData
        })
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const card = document.createElement("div");
    card.classList.add("graph-card");

    const img = document.createElement("img");
    img.src = url;
    img.alt = `${type} chart`;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.classList.add("remove-btn");
    removeBtn.onclick = () => card.remove();

    card.appendChild(removeBtn);
    card.appendChild(img);

    document.getElementById("dashboardGrid").appendChild(card);
});
