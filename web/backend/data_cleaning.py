import pandas as pd
import numpy as np
import re
from dateutil import parser

def clean_data(df, operations, selected_columns=None, date_column=None, missing_columns=None):

    """
    Функция для обработки данных в зависимости от выбранных пользователем операций.
    
    :param df: DataFrame с данными.
    :param operations: Список операций, которые выбрал пользователь.
    :return: Очищенный DataFrame.
    """
    if 'detect_duplicates' in operations:
        print("Detecting duplicates...")
        if selected_columns:
            df = df.drop_duplicates(subset=selected_columns)
        else:
            df = df.drop_duplicates()

    if 'fix_dates' in operations and date_column:
        print(f"Fixing dates in column {date_column}...")
        try:
            df[date_column] = df[date_column].apply(parse_date_safely)
        except Exception as e:
            print(f"Date conversion error: {e}")

    if 'detect_outliers' in operations:
        print("Detecting outliers...")
        # Пример логики для поиска выбросов

    if 'fix_data_types' in operations:
        print("Fixing data types...")
        # Пример логики для исправления типов данных

    if 'make_consistent_column_names' in operations:
        df.columns = df.columns.str.strip().str.replace(' ', '_').str.lower()

    if 'remove_missing_values' in operations and missing_columns:
        print("Removing rows with missing/invalid values in:", missing_columns)

        # Обновляем только нужные колонки
        for col in missing_columns:
            df[col] = df[col].apply(lambda x: np.nan if is_effectively_empty(x) else x)

        df = df.dropna(subset=missing_columns)

    # Обработка inappropriate values
    if 'detect_inappropriate_values' in operations:
        print("Detecting inappropriate values...")
        inappropriate_rows = pd.DataFrame()

        for col in df.columns:
            types = df[col].apply(lambda x: type(x).__name__)
            most_common_type = types.mode()[0]
            ratio = (types == most_common_type).sum() / len(types)
            if ratio >= 0.8:
                mask = types != most_common_type
                temp = df[mask].copy()
                temp['__issue_column__'] = col
                inappropriate_rows = pd.concat([inappropriate_rows, temp], ignore_index=True)

        if not inappropriate_rows.empty:
            df = inappropriate_rows  # возвращаем только неподходящие строки для отображения

    return df


def parse_date_safely(date_str):
    try:
        parsed = parser.parse(str(date_str), fuzzy=True)
        return parsed.strftime('%d.%m.%Y')
    except Exception:
        return None


def is_effectively_empty(value):
    if pd.isnull(value):
        return True
    value = str(value).strip().lower()
    return value in ['', 'nan', 'n/a', '-', '--', 'null', 'none']
