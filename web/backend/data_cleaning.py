import pandas as pd

def clean_data(df, operations):
    """
    Функция для обработки данных в зависимости от выбранных пользователем операций.
    
    :param df: DataFrame с данными.
    :param operations: Список операций, которые выбрал пользователь.
    :return: Очищенный DataFrame.
    """
    if 'detect_duplicates' in operations:
        print("Detecting duplicates...")
        df = df.drop_duplicates()

    if 'detect_outliers' in operations:
        print("Detecting outliers...")
        # Пример логики для поиска выбросов

    if 'fix_data_types' in operations:
        print("Fixing data types...")
        # Пример логики для исправления типов данных

    if 'make_consistent_column_names' in operations:
        df.columns = df.columns.str.strip().str.replace(' ', '_').str.lower()

    if 'detect_inappropriate_values' in operations:
        print("Detecting inappropriate values...")
        # Пример логики для поиска неподходящих значений
    
    return df
