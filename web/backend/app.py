from flask import Flask, request, redirect, url_for, render_template, flash, session, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import sys
import pandas as pd
import io

# Добавляем корневую директорию проекта в sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_cleaning import clean_data

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SECRET_KEY'] = 'your-secret-key'

# Настройки для подключения к базе данных MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Qqqqq111!@localhost/webanalyst'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

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
        return render_template('dashboard.html', user_name=user_name)
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
        return render_template('data_cleaning.html', user_name=user_name)
    return redirect(url_for('login'))

# Маршрут для обработки файла и возврата очищенных данных
@app.route('/process-data', methods=['POST'])
def process_data():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    # Читаем файл в память
    file_stream = io.BytesIO(file.read())
    
    # Определяем формат файла (csv или Excel)
    if file.filename.endswith('.csv'):
        df = pd.read_csv(file_stream)
    else:
        df = pd.read_excel(file_stream)

    # Получаем список выбранных функций
    operations = request.form.getlist('cleaningFunction')

    # Очищаем данные (применяем операции)
    cleaned_df = clean_data(df, operations)

    # Возвращаем очищенные данные в формате JSON
    return jsonify({
        'status': 'success',
        'data': cleaned_df.to_dict(orient='records')  # Преобразуем DataFrame в список словарей для отображения
    })

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



if __name__ == '__main__':
    app.run(debug=True)
