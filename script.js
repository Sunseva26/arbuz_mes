// Тест JSONbin
const KEY = "$2a$10$ZL65O5wkLuGAQhKUTIQwd.GcojkLmcy/IMMUB5jTqLDuZQaDCdoCG";
const BIN = "6a776d38f5f4af5e29fc12de";
const URL = `https://api.jsonbin.io/v3/b/${BIN}`;

async function test() {
    // Чтение
    let res = await fetch(URL + "/latest", { headers: { "X-Master-Key": KEY } });
    let data = await res.json();
    alert("Данные прочитаны! Пользователей: " + data.record.users.length);
}

// Вешаем на все кнопки
document.addEventListener('DOMContentLoaded', function() {
    // Кнопка обычной регистрации
    document.getElementById('btnRegFree')?.addEventListener('click', function() {
        alert('Кнопка работает!');
        test();
    });
    
    // Кнопка VIP
    document.getElementById('btnRegPlus')?.addEventListener('click', function() {
        alert('Кнопка VIP работает!');
        test();
    });
    
    // Карточки выбора
    document.getElementById('cardFree')?.addEventListener('click', function() {
        document.getElementById('chooseScreen').classList.add('hidden');
        document.getElementById('registerFree').classList.remove('hidden');
    });
    
    document.getElementById('cardPlus')?.addEventListener('click', function() {
        document.getElementById('chooseScreen').classList.add('hidden');
        document.getElementById('registerPlus').classList.remove('hidden');
    });
    
    // Кнопки назад
    document.getElementById('backFree')?.addEventListener('click', function() {
        document.getElementById('registerFree').classList.add('hidden');
        document.getElementById('chooseScreen').classList.remove('hidden');
    });
    
    document.getElementById('backPlus')?.addEventListener('click', function() {
        document.getElementById('registerPlus').classList.add('hidden');
        document.getElementById('chooseScreen').classList.remove('hidden');
    });
});
