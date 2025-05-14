let rawModelData = null;

document.getElementById("modelFile").addEventListener("change", async () => {
    const formData = new FormData();
    formData.append("file", modelFile.files[0]);

    const res = await fetch("/predicting-models-parse", {
        method: "POST",
        body: formData
    });

    const json = await res.json();
    rawModelData = json.data;

    const target = document.getElementById("targetColumn");
    const featureBox = document.getElementById("featureCheckboxes");

    target.innerHTML = "";
    featureBox.innerHTML = "";

    json.columns.forEach(col => {
        target.appendChild(new Option(col, col));

        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" name="features" value="${col}"> ${col}`;
        featureBox.appendChild(label);
    });

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

document.getElementById("modelForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const type = document.getElementById("modelType").value;
    const target = document.getElementById("targetColumn").value;
    const features = Array.from(document.querySelectorAll('input[name="features"]:checked')).map(el => el.value);

    const res = await fetch("/predicting-models-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, target, features, data: rawModelData })
    });

    const html = await res.text();
    document.getElementById("modelResults").innerHTML = html;
});
