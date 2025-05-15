import pandas as pd
import numpy as np
import os
import uuid
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import r2_score, mean_absolute_error, accuracy_score, confusion_matrix, classification_report

# Створюємо директорію для збереження графіків, якщо вона ще не існує
PLOT_DIR = "static/predict_plots"
os.makedirs(PLOT_DIR, exist_ok=True)

# Функція збереження графіка у файл із унікальним іменем
def save_plot():
    plot_id = f"{uuid.uuid4().hex}.png"
    path = os.path.join(PLOT_DIR, plot_id)
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    return f"/{path}"

# Основна функція для запуску моделі (лінійної або логістичної)
def run_model(model_type, data, target, features):
    df = pd.DataFrame(data)

    # Перевірка коректності цільової змінної
    if not target or not isinstance(target, str) or target not in df.columns:
        return "<p>❌ Target column is invalid or not selected.</p>"

    # Відбираємо лише потрібні колонки
    df = df[features + [target]].copy()
    df = df.dropna()

    # Приводимо всі значення до числового типу
    X = df[features].apply(pd.to_numeric, errors='coerce')
    y = pd.to_numeric(df[target], errors='coerce')
    df = pd.concat([X, y], axis=1).dropna()

    removed = []  # Ознаки, які будуть видалені
    kept = []     # Ознаки, які залишаються

    # Видаляємо ознаки з малою кореляцією або постійним значенням
    for col in features:
        if df[col].nunique() <= 1:
            removed.append(col)
            continue
        corr = np.corrcoef(df[col], y)[0, 1]
        if abs(corr) < 0.1:
            removed.append(col)
        else:
            kept.append(col)

    if not kept:
        return "<p>🚫 No features with sufficient correlation to target.</p>"

    X = df[kept]
    y = df[target]

    # Розбиваємо дані на тренувальний і тестовий набори
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    messages = ""
    if removed:
        messages += "<p>⚠️ The following features were removed due to low correlation: <b>" + ", ".join(removed) + "</b></p>"

    # Побудова та оцінка моделі
    if model_type == "linear":
        model = LinearRegression()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)

        # Текстова інтерпретація результату
        if r2 < 0.3:
            interp = "Model explains very little of the target variance."
        elif r2 < 0.6:
            interp = "Model has moderate explanatory power."
        else:
            interp = "Model fits the data well."

        # Побудова графіка реальні vs передбачені значення
        fig, ax = plt.subplots()
        ax.scatter(y_test, y_pred, alpha=0.6)
        ax.set_xlabel("Actual")
        ax.set_ylabel("Predicted")
        ax.set_title("Prediction vs Actual")
        plot_url = save_plot()

        return f"""
        {messages}
        <h3>📘 Linear Regression</h3>
        <p><b>R² Score:</b> {r2:.3f}</p>
        <p><b>Mean Absolute Error:</b> {mae:.3f}</p>
        <p>{interp}</p>
        <img src="{plot_url}">
        """

    elif model_type == "logistic":
        model = LogisticRegression(max_iter=1000)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        acc = accuracy_score(y_test, y_pred)

        if acc < 0.6:
            interp = "Low predictive quality."
        elif acc < 0.8:
            interp = "Acceptable accuracy."
        else:
            interp = "High accuracy — model performs well."

        cm = confusion_matrix(y_test, y_pred)

        # Побудова матриці плутанини
        fig, ax = plt.subplots()
        ax.matshow(cm, cmap="Blues")
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")
        ax.set_title("Confusion Matrix")
        plot_url = save_plot()

        report = classification_report(y_test, y_pred)

        return f"""
        {messages}
        <h3>📗 Logistic Regression</h3>
        <p><b>Accuracy:</b> {acc:.3f}</p>
        <p>{interp}</p>
        <pre>{report}</pre>
        <img src="{plot_url}">
        """
