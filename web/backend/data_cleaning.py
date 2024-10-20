import pandas as pd
import os

def clean_data(file, operations):
    """
    Функция для обработки данных в зависимости от выбранных пользователем операций.
    
    :param file: Загруженный файл (pandas DataFrame).
    :param operations: Список операций, которые выбрал пользователь.
    :return: Очищенный DataFrame.
    """
    df = pd.read_csv(file) if file.endswith('.csv') else pd.read_excel(file)
    
    if 'detect_duplicates' in operations:
        print("Detecting duplicates...")
        # Здесь будет логика для поиска дубликатов

    if 'detect_outliers' in operations:
        print("Detecting outliers...")
        # Здесь будет логика для поиска выбросов

    if 'fix_data_types' in operations:
        print("Fixing data types...")
        # Здесь будет логика для исправления типов данных

    if 'make_consistent_column_names' in operations:
        df.columns = df.columns.str.strip().str.replace(' ', '_').str.lower()
        # Здесь будет логика для стандартизации имен колонок

    if 'detect_inappropriate_values' in operations:
        print("Detecting inappropriate values...")
        # Здесь будет логика для поиска неподходящих значений
    
    # Создаем папку "Prepared Data", если её нет
    output_folder = 'Prepared Data'
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Генерируем уникальное имя для очищенного файла
    file_name = os.path.basename(file)
    cleaned_file_path = os.path.join(output_folder, f"cleaned_{file_name}")
    
    # Сохраняем очищенный файл
    if file.endswith('.csv'):
        df.to_csv(cleaned_file_path, index=False)
    else:
        df.to_excel(cleaned_file_path, index=False)
    
    return cleaned_file_path  # Возвращаем путь к очищенному файлу
