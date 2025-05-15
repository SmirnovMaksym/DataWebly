// Обробка події зміни аватара — показ попереднього перегляду
document.getElementById('avatar').addEventListener('change', function(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        // Коли файл прочитано — оновлюємо src для відображення аватарки
        reader.onload = function(e) {
            document.querySelector('.profile-avatar').src = e.target.result;
        };

        reader.readAsDataURL(file); // Читання файлу у вигляді DataURL
    }
});
