// Показати форму реєстрації, приховавши форму входу
function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

// Показати форму входу, приховавши форму реєстрації
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

// Перевірка відповідності пароля і підтвердження пароля
function checkPasswords() {
    var password = document.getElementById('registerPassword').value;
    var confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        document.getElementById('passwordError').innerText = 'Passwords do not match';
        return false;
    }
    return true;
}

// При завантаженні сторінки визначаємо, яку форму показати: логін чи реєстрацію
window.onload = function() {
    var showRegisterValue = document.getElementById('showRegister').value;
    if (showRegisterValue === 'true') {
        showRegister();
    }
};

// Перемикання відображення меню профілю
function toggleProfileMenu() {
    var profileMenu = document.getElementById('profileMenu');
    profileMenu.classList.toggle('active');
}
