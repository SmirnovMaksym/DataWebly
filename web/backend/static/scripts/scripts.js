function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function checkPasswords() {
    var password = document.getElementById('registerPassword').value;
    var confirmPassword = document.getElementById('registerConfirmPassword').value;
    if (password !== confirmPassword) {
        document.getElementById('passwordError').innerText = 'Passwords do not match';
        return false;
    }
    return true;
}


// Проверка значения поля showRegister и отображение соответствующей формы при загрузке
window.onload = function() {
    var showRegisterValue = document.getElementById('showRegister').value;
    if (showRegisterValue === 'true') {
        showRegister();
    }
};


function toggleProfileMenu() {
    var profileMenu = document.getElementById('profileMenu');
    profileMenu.classList.toggle('active'); // Открываем или закрываем меню
}


