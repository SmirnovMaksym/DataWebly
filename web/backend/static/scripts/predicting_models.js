let rawModelData = null;

// Обробка події зміни файлу (після завантаження датасету)
document.getElementById("modelFile").addEventListener("change", async () => {
    const formData = new FormData();
    formData.append("file", modelFile.files[0]);

    // Надсилаємо файл на сервер для отримання колонок і попередніх даних
    const res = await fetch("/predicting-models-parse", {
        method: "POST",
        body: formData
    });

    const json = await res.json();
    rawModelData = json.data;

    // Очищаємо попередні значення
    const target = document.getElementById("targetColumn");
    const featureBox = document.getElementById("featureCheckboxes");

    target.innerHTML = "";
    featureBox.innerHTML = "";

    // Створюємо варіанти для вибору цільової змінної і чекбокси для ознак
    json.columns.forEach(col => {
        target.appendChild(new Option(col, col));

        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" name="features" value="${col}"> ${col}`;
        featureBox.appendChild(label);
    });

    // Автоматично деактивуємо чекбокс, який відповідає цільовій змінній
    target.addEventListener("change", () => {
        const selected = target.value;
        const checkboxes = document.querySelectorAll('#featureCheckboxes input');

        checkboxes.forEach(cb => {
            if (cb.value === selected) {
                cb.disabled = true;
                cb.checked = false;
            } else {
                cb.disabled = false;
            }
        });
    });
});

// Обробка відправки форми для запуску моделі
document.getElementById("modelForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // Не перезавантажуємо сторінку

    const type = document.getElementById("modelType").value;
    const target = document.getElementById("targetColumn").value;
    const features = Array.from(document.querySelectorAll('input[name="features"]:checked')).map(el => el.value);

    // Надсилаємо запит на сервер для запуску моделі
    const res = await fetch("/predicting-models-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, target, features, data: rawModelData })
    });

    // Отримуємо HTML-звіт і відображаємо його
    const html = await res.text();
    document.getElementById("modelResults").innerHTML = html;
});
