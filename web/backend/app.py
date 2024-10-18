from flask import Flask, request, redirect, url_for, render_template, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
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
            # Сохранение имени пользователя в сессии после успешного логина
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
    # Проверка, есть ли пользователь в сессии
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

        # Проверка на совпадение паролей
        if password != confirm_password:
            password_error = 'Passwords do not match.'
            return render_template('index.html', email_error=email_error, password_error=password_error, name=name, email=email, show_register=True)

        # Проверка на существование email
        user = User.query.filter_by(email=email).first()
        if user:
            email_error = 'Email already exists.'
            return render_template('index.html', email_error=email_error, password_error=password_error, name=name, email=email, show_register=True)

        # Хэширование пароля и создание нового пользователя
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(name=name, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        flash('Registration successful, please login.')
        return redirect(url_for('index'))

    return render_template('index.html', email_error=email_error, password_error=password_error, name=name, email=email)

if __name__ == '__main__':
    app.run(debug=True)
