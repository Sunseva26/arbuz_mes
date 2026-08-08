const KEY = "$2a$10$ZL65O5wkLuGAQhKUTIQwd.GcojkLmcy/IMMUB5jTqLDuZQaDCdoCG";
const BIN = "6a776d38f5f4af5e29fc12de";
const URL = `https://api.jsonbin.io/v3/b/${BIN}`;

let currentUser = null;
let currentChat = null;
let timer = null;

const VIP_KEYS = [
    "ARBZ-VIP1-2024-PLUS","ARBZ-VIP2-2024-GOLD","ARBZ-VIP3-2024-PRO",
    "ARBZ-VIP4-2024-MAX","ARBZ-VIP5-2024-ELITE","ARBZ-VIP6-2024-PRIME",
    "ARBZ-VIP7-2024-ULTRA","ARBZ-VIP8-2024-MEGA","ARBZ-VIP9-2024-SUPER",
    "ARBZ-VIP10-2024-KING","ARBZ-VIP11-2024-STAR","ARBZ-VIP12-2024-ROYAL",
    "ARBZ-VIP13-2024-DIAMOND","ARBZ-VIP14-2024-PLATINUM","ARBZ-VIP15-2024-TITAN",
    "ARBZ-VIP16-2024-LEGEND","ARBZ-VIP17-2024-CHAMPION","ARBZ-VIP18-2024-EMPEROR",
    "ARBZ-VIP19-2024-DYNASTY","ARBZ-VIP20-2024-SUPREME"
];

async function read() {
    let r = await fetch(URL + "/latest", { headers: { "X-Master-Key": KEY } });
    let d = await r.json();
    return d.record;
}

async function write(record) {
    await fetch(URL, {
        method: "PUT",
        headers: { "X-Master-Key": KEY, "Content-Type": "application/json" },
        body: JSON.stringify(record)
    });
}

function show(id) {
    alert('Показываю экран: ' + id);
    let screens = document.querySelectorAll('.screen');
    for(let s of screens) s.classList.add('hidden');
    let el = document.getElementById(id);
    if(el) {
        el.classList.remove('hidden');
        alert('Экран ' + id + ' открыт!');
    } else {
        alert('Экран ' + id + ' НЕ НАЙДЕН!');
    }
}

function formatPhone(input) {
    let v = input.value.replace(/\D/g,'').slice(0,10);
    let f = '';
    if(v.length>0) f+=v.slice(0,3);
    if(v.length>3) f+=' '+v.slice(3,6);
    if(v.length>6) f+='-'+v.slice(6,8);
    if(v.length>8) f+='-'+v.slice(8,10);
    input.value = f;
}

async function register(isPlus) {
    alert('Начало регистрации, isPlus=' + isPlus);
    
    let nameField = document.getElementById(isPlus ? 'regNamePlus' : 'regNameFree');
    let phoneField = document.getElementById(isPlus ? 'regPhonePlus' : 'regPhoneFree');
    
    if(!nameField || !phoneField) {
        alert('Поля не найдены!');
        return;
    }
    
    let name = nameField.value.trim();
    let phone = phoneField.value.replace(/\D/g,'');
    
    alert('Имя: ' + name + ', Телефон: ' + phone);
    
    if(!name) { alert('Нет имени'); return; }
    if(phone.length !== 10) { alert('Телефон не 10 цифр'); return; }
    
    alert('Читаю базу...');
    let data = await read();
    alert('В базе пользователей: ' + data.users.length);
    
    let user = data.users.find(u => u.phone === '+7'+phone);
    
    if(user) {
        user.name = name;
        alert('Пользователь обновлён');
    } else {
        user = {
            id: Date.now().toString(36),
            name, phone: '+7'+phone,
            isPlus: isPlus || false,
            createdAt: Date.now()
        };
        data.users.push(user);
        alert('Новый пользователь создан');
    }
    
    await write(data);
    alert('Данные сохранены!');
    
    currentUser = user;
    localStorage.setItem('arbuz_user', JSON.stringify(user));
    
    show('chatsScreen');
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    alert('Страница загружена!');
    
    document.getElementById('cardFree').onclick = function() {
        alert('Выбрана обычная версия');
        show('registerFree');
    };
    
    document.getElementById('cardPlus').onclick = function() {
        alert('Выбрана VIP версия');
        show('registerPlus');
    };
    
    document.getElementById('backFree').onclick = function() {
        show('chooseScreen');
    };
    
    document.getElementById('backPlus').onclick = function() {
        show('chooseScreen');
    };
    
    document.getElementById('btnRegFree').onclick = function() {
        alert('Кнопка Регистрация нажата');
        register(false);
    };
    
    document.getElementById('btnRegPlus').onclick = function() {
        alert('Кнопка VIP нажата');
        register(true);
    };
});
