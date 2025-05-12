import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import os
import uuid

# Каталог для сохранения временных графиков
TEMP_IMG_DIR = "static/temp_insight_plots"
os.makedirs(TEMP_IMG_DIR, exist_ok=True)

def save_plot(fig):
    plot_id = f"{uuid.uuid4().hex}.png"
    path = os.path.join(TEMP_IMG_DIR, plot_id)
    fig.savefig(path, bbox_inches='tight')
    plt.close(fig)
    return f"/{path}"

def generate_insights(df):
    numeric_df = df.select_dtypes(include='number')

    # ——— Statistical Summary ———
    stats_html = "<div class='insight-box'><h3>📊 Statistical Summary</h3>"
    try:
        stats = numeric_df.describe().T
        stats['median'] = numeric_df.median()
        stats_html += stats.to_html(classes="insight-table")
    except Exception as e:
        stats_html += f"<p>Error: {str(e)}</p>"
    stats_html += "</div>"

    # ——— Outliers ———
    outliers_html = "<div class='insight-box'><h3>🚨 Outliers & Anomalies</h3>"
    messages = []
    tables = []
    for col in numeric_df.columns:
        try:
            z = (numeric_df[col] - numeric_df[col].mean()) / numeric_df[col].std()
            outliers = df[np.abs(z) > 3]
            if not outliers.empty:
                messages.append(f"<li>{len(outliers)} outliers in <b>{col}</b></li>")
                tables.append(outliers[[col]].head(5).to_html(classes="insight-table"))

                # Boxplot
                fig, ax = plt.subplots()
                ax.boxplot(df[col].dropna())
                ax.set_title(f"Outliers in {col}")
                ax.set_ylabel(col)
                img_path = save_plot(fig)
                tables.append(f'<img src="{img_path}" class="insight-img">')

        except Exception:
            continue
    outliers_html += "<ul>" + "".join(messages) + "</ul>" if messages else "<p>No significant outliers.</p>"
    outliers_html += "".join(tables)
    outliers_html += "</div>"

    # ——— Correlations ———
    corr_html = "<div class='insight-box'><h3>🔗 Correlation Matrix</h3>"
    insights = []
    if numeric_df.shape[1] > 1:
        try:
            corr = numeric_df.corr()
            corr_html += corr.to_html(classes="insight-table")
            for i in range(len(corr.columns)):
                for j in range(i + 1, len(corr.columns)):
                    col1, col2 = corr.columns[i], corr.columns[j]
                    coef = corr.iloc[i, j]
                    abs_coef = abs(coef)
                    if abs_coef >= 0.4:
                        strength = "strong" if abs_coef >= 0.7 else "moderate"
                        direction = "positive" if coef > 0 else "negative"
                        insights.append(f"<li>{strength} {direction} correlation between <b>{col1}</b> and <b>{col2}</b> (r = {coef:.2f})</li>")

                        # Scatter plot
                        fig, ax = plt.subplots()
                        ax.scatter(df[col1], df[col2], alpha=0.5)
                        ax.set_title(f"{col1} vs {col2}")
                        ax.set_xlabel(col1)
                        ax.set_ylabel(col2)
                        img_path = save_plot(fig)
                        insights.append(f'<img src="{img_path}" class="insight-img">')

            corr_html += "<h4>🧠 Insights:</h4><ul>" + "".join(insights) + "</ul>" if insights else "<p>No strong correlations.</p>"
        except Exception as e:
            corr_html += f"<p>Error: {str(e)}</p>"
    else:
        corr_html += "<p>Only one numeric column found — correlation skipped.</p>"
    corr_html += "</div>"

    # ——— Trends ———
    trends_html = "<div class='insight-box'><h3>📈 Trends & Seasonality</h3>"
    date_col = None
    for col in df.columns:
        if df[col].dtype.kind in "biufc":
            continue
        parsed = pd.to_datetime(df[col], errors='coerce')
        if parsed.notnull().mean() > 0.8:
            df[col] = parsed
            date_col = col
            break

    if not date_col:
        trends_html += "<p>No valid datetime column detected.</p></div>"
    else:
        trends_html += f"<p>Detected date column: <b>{date_col}</b></p>"
        try:
            df = df.sort_values(by=date_col)
            df['__date_as_int__'] = df[date_col].astype('int64')
            insights = []
            for col in numeric_df.columns:
                if col == '__date_as_int__' or df[col].isnull().all():
                    continue
                corr = np.corrcoef(df['__date_as_int__'], df[col])[0, 1]
                if abs(corr) < 0.2:
                    insights.append(f"<li><b>{col}</b>: no clear trend (r = {corr:.2f})</li>")
                elif corr > 0.2:
                    insights.append(f"<li><b>{col}</b> increases over time (r = {corr:.2f})</li>")
                else:
                    insights.append(f"<li><b>{col}</b> decreases over time (r = {corr:.2f})</li>")

                # Trend plot
                fig, ax = plt.subplots()
                ax.plot(df[date_col], df[col])
                ax.set_title(f"{col} over time")
                ax.set_xlabel(date_col)
                ax.set_ylabel(col)
                img_path = save_plot(fig)
                insights.append(f'<img src="{img_path}" class="insight-img">')

            trends_html += "<h4>🧠 Trend Insights:</h4><ul>" + "".join(insights) + "</ul>"
        except Exception as e:
            trends_html += f"<p>Error: {str(e)}</p>"
        trends_html += "</div>"

    return f"""
    <div class="insights-wrapper">
        <div class="insights-grid">
            <div class="insight-column">{stats_html}{outliers_html}</div>
            <div class="insight-column">{corr_html}{trends_html}</div>
        </div>
    </div>
    """
