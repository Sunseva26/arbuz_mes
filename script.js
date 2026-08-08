// API конфигурация
const API_BASE = '/.netlify/functions';
let currentUser = null;
let currentChat = null;

// VIP ключи
const VIP_KEYS = [
    "ARBZ-VIP1-2024-PLUS","ARBZ-VIP2-2024-GOLD","ARBZ-VIP3-2024-PRO",
    "ARBZ-VIP4-2024-MAX","ARBZ-VIP5-2024-ELITE","ARBZ-VIP6-2024-PRIME",
    "ARBZ-VIP7-2024-ULTRA","ARBZ-VIP8-2024-MEGA","ARBZ-VIP9-2024-SUPER",
    "ARBZ-VIP10-2024-KING","ARBZ-VIP11-2024-STAR","ARBZ-VIP12-2024-ROYAL",
    "ARBZ-VIP13-2024-DIAMOND","ARBZ-VIP14-2024-PLATINUM","ARBZ-VIP15-2024-TITAN",
    "ARBZ-VIP16-2024-LEGEND","ARBZ-VIP17-2024-CHAMPION","ARBZ-VIP18-2024-EMPEROR",
    "ARBZ-VIP19-2024-DYNASTY","ARBZ-VIP20-2024-SUPREME"
];

const MAX_FREE = 50;
const MAX_PLUS = 100;
const VIP_DAYS = 90;

// Показать экран
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'chatsScreen') loadChats();
}

// Формат телефона
function formatPhone(input) {
    let v = input.value.replace(/\D/g,'').slice(0,10);
    let f = '';
    if(v.length>0) f+=v.slice(0,3);
    if(v.length>3) f+=' '+v.slice(3,6);
    if(v.length>6) f+='-'+v.slice(6,8);
    if(v.length>8) f+='-'+v.slice(8,10);
    input.value = f;
}

// Тост
function toast(msg, type='error') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.classList.remove('show'), 3000);
}

// API запросы
async function api(path, data=null) {
    try {
        const res = await fetch(API_BASE + path, {
            method: data ? 'POST' : 'GET',
            headers: {'Content-Type':'application/json'},
            body: data ? JSON.stringify(data) : null
        });
        return await res.json();
    } catch(e) {
        toast('Ошибка соединения');
        return null;
    }
}

// Регистрация
async function register(isPlus) {
    const name = document.getElementById(isPlus ? 'regNamePlus' : 'regNameFree').value.trim();
    const phone = document.getElementById(isPlus ? 'regPhonePlus' : 'regPhoneFree').value.replace(/\D/g,'');
    const vipKey = isPlus ? document.getElementById('regVipKey').value.trim().toUpperCase() : null;
    
    if(!name) return toast('Введите имя');
    if(phone.length !== 10) return toast('Введите номер полностью');
    if(isPlus && !VIP_KEYS.includes(vipKey)) return toast('Неверный VIP-ключ');
    
    const result = await api('/register', {
        name,
        phone: '+7'+phone,
        isPlus,
        vipKey: isPlus ? vipKey : null
    });
    
    if(result && result.success) {
        currentUser = result.user;
        localStorage.setItem('arbuz_user', JSON.stringify(currentUser));
        showScreen('chatsScreen');
        document.getElementById('navTitle').textContent = isPlus ? '🍉⭐ Арбуз Плюс' : '🍉 Арбуз';
        toast('Регистрация успешна!', 'success');
    }
}

// Загрузка чатов
async function loadChats() {
    if(!currentUser) {
        const saved = localStorage.getItem('arbuz_user');
        if(saved) currentUser = JSON.parse(saved);
        else return;
    }
    
    const result = await api('/get-chats', {userId: currentUser.id});
    const list = document.getElementById('chatsList');
    
    if(!result || !result.chats || result.chats.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Нет чатов</div>';
        return;
    }
    
    list.innerHTML = result.chats.map(c => `
        <div class="list-item" onclick="openChat('${c.chatId}','${c.user.id}','${c.user.name}','${c.user.phone}')">
            <div class="avatar ${c.user.isPlus ? 'gold' : ''}">${c.user.name[0]}</div>
            <div class="item-info">
                <div class="item-name">${c.user.name} ${c.user.isPlus ? '⭐' : ''}</div>
                <div class="item-sub">${c.lastMessage || c.user.phone}</div>
            </div>
        </div>
    `).join('');
}

// Поиск
async function searchUsers() {
    const q = document.getElementById('searchInput').value.replace(/\D/g,'');
    if(q.length < 3) { loadChats(); return; }
    
    const result = await api('/search', {query: q});
    const list = document.getElementById('chatsList');
    
    if(!result || !result.users || result.users.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Не найдено</div>';
        return;
    }
    
    list.innerHTML = result.users.map(u => `
        <div class="list-item" onclick="startChat('${u.id}')">
            <div class="avatar ${u.isPlus ? 'gold' : ''}">${u.name[0]}</div>
            <div class="item-info">
                <div class="item-name">${u.name} ${u.isPlus ? '⭐' : ''}</div>
                <div class="item-sub">${u.phone}</div>
            </div>
        </div>
    `).join('');
}

// Открыть чат
async function openChat(chatId, userId, name, phone) {
    currentChat = {chatId, userId, name, phone};
    document.getElementById('chatAv').textContent = name[0];
    document.getElementById('chatName').textContent = name;
    document.getElementById('chatPhone').textContent = phone;
    showScreen('chatScreen');
    await loadMessages();
}

async function startChat(userId) {
    const result = await api('/send', {
        type: 'createChat',
        userId: currentUser.id,
        targetId: userId
    });
    if(result && result.chatId) {
        // Обновим и откроем
        loadChats();
    }
}

// Загрузка сообщений
async function loadMessages() {
    if(!currentChat) return;
    const result = await api('/get-messages', {chatId: currentChat.chatId});
    const list = document.getElementById('messagesList');
    
    if(!result || !result.messages) {
        list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Нет сообщений</div>';
        return;
    }
    
    list.innerHTML = result.messages.map(m => `
        <div class="message ${m.senderId === currentUser.id ? 'sent' : 'received'}">
            ${m.text}
            <div class="msg-time">${new Date(m.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
    `).join('');
    list.scrollTop = list.scrollHeight;
}

// Отправить сообщение
async function sendMessage() {
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    if(!text || !currentChat) return;
    
    await api('/send', {
        type: 'message',
        chatId: currentChat.chatId,
        senderId: currentUser.id,
        text,
        senderName: currentUser.name
    });
    
    input.value = '';
    loadMessages();
}

// Выход
function logout() {
    localStorage.removeItem('arbuz_user');
    currentUser = null;
    showScreen('chooseScreen');
}

// Инициализация
const saved = localStorage.getItem('arbuz_user');
if(saved) {
    currentUser = JSON.parse(saved);
    showScreen('chatsScreen');
    loadChats();
  }
