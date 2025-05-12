from flask import Flask, request, redirect, url_for, render_template, flash, session, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import sys
import pandas as pd
import io
import uuid
import matplotlib
matplotlib.use('Agg')  # 🔧 ОБЯЗАТЕЛЬНО ДО ИМПОРТА pyplot
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from flask import send_file, jsonify
import pdfkit
import tempfile
from xhtml2pdf import pisa
import tempfile



# Добавляем корневую директорию проекта в sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_cleaning import clean_data
from insights_utils import generate_insights
from plot_utils import build_plot as generate_plot

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SECRET_KEY'] = 'your-secret-key'

# Настройки для подключения к базе данных MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Qqqqq111!@localhost/webanalyst'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

TEMP_FOLDER = 'temp_files'
app.config['TEMP_FOLDER'] = TEMP_FOLDER

if not os.path.exists(TEMP_FOLDER):
    os.makedirs(TEMP_FOLDER)

# Определение модели пользователя
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    avatar = db.Column(db.String(255), default='default.png')
    bio = db.Column(db.Text)  # Поле для биографии
    country = db.Column(db.String(100))  # Поле для страны
    linkedin = db.Column(db.String(255))  # Поле для ссылки LinkedIn

    def __repr__(self):
        return '<User %r>' % self.name

# Основная страница с формами логина и регистрации
@app.route('/')
def index():
    return render_template('index.html', email='', name='', email_error='', password_error='')

# Обработка логина
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['user_name'] = user.name
            session['user_avatar'] = user.avatar  # добавляем аватар в сессию
            return redirect(url_for('dashboard'))

        flash('Invalid email or password.')
        return redirect(url_for('index'))

    return render_template('index.html')

# Обработка выхода
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('user_name', None)
    flash('You have been logged out.')
    return redirect(url_for('login'))

# Страница пользователя после успешного входа
@app.route('/dashboard')
def dashboard():
    if 'user_name' in session:
        user_name = session['user_name']
        user_avatar = session.get('user_avatar', 'default-avatar.jpg')  # используем аватар по умолчанию, если не найден
        return render_template('dashboard.html', user_name=user_name, user_avatar=user_avatar)
    return redirect(url_for('login'))

# Обработка регистрации
@app.route('/register', methods=['GET', 'POST'])
def register():
    email_error = ''
    password_error = ''
    name = ''
    email = ''

    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        if password != confirm_password:
            password_error = 'Passwords do not match'
            return render_template('index.html', email_error=email_error, password_error=password_error, name=name, email=email, show_register=True)

        user = User.query.filter_by(email=email).first()
        if user:
            email_error = 'Email already exists.'
            return render_template('index.html', email_error=email_error, password_error=password_error, name=name, email=email, show_register=True)

        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(name=name, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        flash('Registration successful, please login.')
        return redirect(url_for('index'))

    return render_template('index.html', email_error=email_error, password_error=password_error, name=name, email=email)

@app.route('/data-cleaning')
def data_cleaning():
    if 'user_name' in session:
        user_name = session['user_name']
        user_avatar = session.get('user_avatar', 'default-avatar.jpg')
        return render_template('data_cleaning.html', user_name=user_name, user_avatar=user_avatar)
    return redirect(url_for('login'))

# Маршрут для обработки файла и возврата очищенных данных
@app.route('/process-data', methods=['POST'])
def process_data():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    # Чтение файла
    file_stream = io.BytesIO(file.read())
    if file.filename.endswith('.csv'):
        df = pd.read_csv(file_stream)
    else:
        df = pd.read_excel(file_stream)

    preview_df = df.head(10)
    operations = request.form.getlist('cleaningFunction')
    selected_columns = request.form.getlist(
        'selectedColumns')  # получаем выбранные пользователем столбцы для удаления дубликатов
    date_column = request.form.get('dateColumn')  # получаем выбранный столбец с датами
    missing_columns = request.form.getlist('missingValueColumns')

    cleaned_df = clean_data(df, operations, selected_columns, date_column, missing_columns)

    # Сохранение очищенного файла с уникальным именем
    file_id = str(uuid.uuid4())  # Генерация уникального имени
    file_path = os.path.join(app.config['TEMP_FOLDER'], f'{file_id}.csv')
    cleaned_df.to_csv(file_path, index=False)

    def safe_json(df):
        return df.where(pd.notnull(df), None).to_dict(orient='records')

    return jsonify({
        'status': 'success',
        'preview': safe_json(preview_df),
        'cleaned_preview': safe_json(cleaned_df.head(10)),
        'file_id': file_id
    })



@app.route('/download-cleaned-file/<file_id>', methods=['GET'])
def download_cleaned_file(file_id):
    file_path = os.path.join(app.config['TEMP_FOLDER'], f'{file_id}.csv')
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({'error': 'File not found'}), 404

AVATAR_UPLOAD_FOLDER = 'static/avatars'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = AVATAR_UPLOAD_FOLDER

# Функция для проверки типа загружаемого файла
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Маршрут для отображения профиля
@app.route('/profile')
def profile():
    if 'user_id' in session:
        user_id = session['user_id']
        user = User.query.get(user_id)

        # Передаем значения полей в шаблон
        return render_template('profile.html', 
                               user_name=user.name, 
                               user_avatar=user.avatar,
                               user_bio=user.bio, 
                               user_country=user.country, 
                               user_linkedin=user.linkedin)
    return redirect(url_for('login'))


@app.route('/update-profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    user_id = session['user_id']
    user = User.query.get(user_id)

    # Изменение имени пользователя
    new_name = request.form['username']
    user.name = new_name

    # Изменение био, страны и LinkedIn
    user.bio = request.form['bio']
    user.country = request.form['country']
    user.linkedin = request.form['linkedin']

    # Проверка, загружен ли новый аватар
    if 'avatar' in request.files:
        avatar = request.files['avatar']
        if avatar and allowed_file(avatar.filename):
            filename = secure_filename(avatar.filename)
            avatar.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            user.avatar = filename

    db.session.commit()
    session['user_name'] = user.name
    session['user_avatar'] = user.avatar

    flash('Profile updated successfully!')
    return redirect(url_for('profile'))

@app.route('/preview-columns', methods=['POST'])
def preview_columns():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    file_stream = io.BytesIO(file.read())
    if file.filename.endswith('.csv'):
        df = pd.read_csv(file_stream, nrows=5)
    else:
        df = pd.read_excel(file_stream, nrows=5)

    columns = list(df.columns)
    return jsonify({'columns': columns})

@app.route('/preview-data', methods=['POST'])
def preview_data():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    file_stream = io.BytesIO(file.read())
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file_stream)
        else:
            df = pd.read_excel(file_stream)
    except Exception as e:
        return jsonify({'error': str(e)})

    preview_df = df.head(10)
    return jsonify({'preview': preview_df.where(pd.notnull(preview_df), None).to_dict(orient='records')})


@app.route('/simple-plots')
def simple_plots():
    if 'user_name' not in session:
        return redirect(url_for('login'))
    return render_template('simple_plots.html',
                           user_name=session['user_name'],
                           user_avatar=session.get('user_avatar', 'default-avatar.jpg'))

@app.route('/get-plot-columns', methods=['POST'])
def get_plot_columns():
    files = request.files.getlist('files')
    if len(files) == 0:
        return jsonify({'error': 'No files provided'}), 400

    dfs = [pd.read_csv(f) if f.filename.endswith('.csv') else pd.read_excel(f) for f in files]

    if len(dfs) == 1:
        return jsonify({
            'file1': list(dfs[0].columns)
        })
    elif len(dfs) >= 2:
        return jsonify({
            'file1': list(dfs[0].columns),
            'file2': list(dfs[1].columns)
        })

@app.route('/build-plot', methods=['POST'])
def build_plot():
    try:
        files = request.files.getlist('files')
        if len(files) == 0:
            return 'No files uploaded', 400

        buf, mimetype = generate_plot(files, request.form)
        return send_file(buf, mimetype=mimetype)

    except Exception as e:
        return str(e), 500


@app.route('/get-insights')
def get_insights():
    if 'user_name' not in session:
        return redirect(url_for('login'))
    return render_template('get_insights.html',
                           user_name=session['user_name'],
                           user_avatar=session.get('user_avatar', 'default-avatar.jpg'))

@app.route('/analyze-insights', methods=['POST'])
def analyze_insights():
    if 'file' not in request.files:
        return "No file provided", 400

    file = request.files['file']
    if file.filename.endswith('.csv'):
        df = pd.read_csv(file)
    else:
        df = pd.read_excel(file)

    try:
        df = df.convert_dtypes()
        df = df.copy()
        for col in df.columns:
            if df[col].dtype == 'string':
                try:
                    parsed = pd.to_datetime(df[col])
                    if parsed.notnull().sum() > len(df) * 0.8:
                        df[col] = parsed
                except Exception:
                    continue
        return generate_insights(df)
    except Exception as e:
        return f"<p>Error processing file: {str(e)}</p>"

@app.route('/download-insights-pdf', methods=['POST'])
def download_insights_pdf():
    data = request.get_json()
    html_content = data.get('html')

    if not html_content:
        return jsonify({'error': 'No HTML provided'}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        pdf_path = tmp_file.name

        # Преобразование HTML в PDF
        with open(pdf_path, "w+b") as f:
            pisa_status = pisa.CreatePDF(html_content, dest=f, link_callback=lambda uri, rel: os.path.join('static', uri.split('/')[-1]))

        if pisa_status.err:
            return jsonify({'error': 'PDF generation failed'}), 500

        return send_file(pdf_path, mimetype='application/pdf', as_attachment=True, download_name='insights_report.pdf')


if __name__ == '__main__':
    app.run(debug=True)



