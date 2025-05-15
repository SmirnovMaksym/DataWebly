let currentData = null;

// Обробка завантаження файлу користувачем
document.getElementById("dashboardFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    // Надсилаємо файл на сервер для попереднього аналізу
    const res = await fetch("/dashboard-parse", {
        method: "POST",
        body: formData
    });

    const json = await res.json();
    currentData = json.data;

    // Отримуємо список колонок
    const columns = json.columns;
    const xAxis = document.getElementById("xAxis");
    const yAxis = document.getElementById("yAxis");

    // Очищаємо попередній список
    xAxis.innerHTML = "";
    yAxis.innerHTML = "";

    // Додаємо колонки до списків вибору осей
    columns.forEach(col => {
        const opt1 = new Option(col, col);
        const opt2 = new Option(col, col);
        xAxis.appendChild(opt1);
        yAxis.appendChild(opt2);
    });
});

// Обробка події побудови графіку
document.getElementById("graphForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // Забороняємо перезавантаження сторінки

    const type = document.getElementById("graphType").value;
    const x = document.getElementById("xAxis").value;
    const y = document.getElementById("yAxis").value;

    // Надсилаємо запит на побудову графіка
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
    const url = URL.createObjectURL(blob); // Створюємо посилання на зображення

    // Створюємо блок для відображення графіку
    const card = document.createElement("div");
    card.classList.add("graph-card");

    const img = document.createElement("img");
    img.src = url;
    img.alt = `${type} chart`;

    // Кнопка для видалення графіку
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.classList.add("remove-btn");
    removeBtn.onclick = () => card.remove();

    card.appendChild(removeBtn);
    card.appendChild(img);

    // Додаємо графік на дашборд
    document.getElementById("dashboardGrid").appendChild(card);
});
