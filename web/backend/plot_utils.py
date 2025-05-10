import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io

def build_plot(file_objs, params):
    files = file_objs
    x = params['x_column']
    y = params['y_column']
    plot_type = params['plot_type']
    title = params.get('plot_title', '')
    fmt = params.get('format', 'png')

    df1 = pd.read_csv(files[0]) if files[0].filename.endswith('.csv') else pd.read_excel(files[0])

    if len(files) == 2:
        df2 = pd.read_csv(files[1]) if files[1].filename.endswith('.csv') else pd.read_excel(files[1])
        left_on = params['merge_left']
        right_on = params['merge_right']
        df = df1.merge(df2, left_on=left_on, right_on=right_on)
    else:
        df = df1

    plt.clf()
    fig, ax = plt.subplots()

    try:
        if plot_type == 'bar':
            grouped = df.groupby(x)[y].sum()
            grouped.plot(kind='bar', ax=ax)
        elif plot_type == 'line':
            df.sort_values(x).plot(x=x, y=y, kind='line', ax=ax)
        elif plot_type == 'pie':
            grouped = df.groupby(x)[y].sum()
            grouped.plot(kind='pie', autopct='%1.1f%%', ax=ax)
            ax.set_ylabel("")
        elif plot_type == 'scatter':
            df.plot(x=x, y=y, kind='scatter', ax=ax)

        ax.set_title(title)
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format='jpeg' if fmt == 'jpeg' else 'png')
        buf.seek(0)
        mimetype = f'image/{fmt}'
        return buf, mimetype

    except Exception as e:
        raise RuntimeError(f"Plot error: {str(e)}")
