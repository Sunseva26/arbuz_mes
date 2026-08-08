// JSONbin конфигурация
const JSONBIN_API_KEY = "$2a$10$ZL65O5wkLuGAQhKUTIQwd.GcojkLmcy/IMMUB5jTqLDuZQaDCdoCG";
const JSONBIN_BIN_ID = "6a776d38f5f4af5e29fc12de";
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

let currentUser = null;
let currentChat = null;
let updateInterval = null;

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

// API запросы к JSONbin
async function readData() {
    try {
        const res = await fetch(JSONBIN_URL + "/latest", {
            headers: { "X-Master-Key": JSONBIN_API_KEY }
        });
        const data = await res.json();
        return data.record;
    } catch(e) {
        console.error("Ошибка чтения:", e);
        return { users: [], chats: [], messages: [] };
    }
}

async function writeData(record) {
    try {
        await fetch(JSONBIN_URL, {
            method: "PUT",
            headers: {
                "X-Master-Key": JSONBIN_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(record)
        });
    } catch(e) {
        console.error("Ошибка записи:", e);
    }
}

// Показать экран
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
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
    if(!t) return;
    t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Регистрация
async function register(isPlus) {
    const nameField = document.getElementById(isPlus ? 'regNamePlus' : 'regNameFree');
    const phoneField = document.getElementById(isPlus ? 'regPhonePlus' : 'regPhoneFree');
    
    if(!nameField || !phoneField) {
        toast('Ошибка формы');
        return;
    }
    
    const name = nameField.value.trim();
    const phone = phoneField.value.replace(/\D/g,'');
    const vipKey = isPlus ? document.getElementById('regVipKey')?.value.trim().toUpperCase() : null;
    
    if(!name) { toast('Введите имя'); return; }
    if(phone.length !== 10) { toast('Введите номер полностью (10 цифр)'); return; }
    if(isPlus && !VIP_KEYS.includes(vipKey)) { toast('Неверный VIP-ключ'); return; }
    
    const data = await readData();
    const fullPhone = '+7' + phone;
    
    let user = data.users.find(u => u.phone === fullPhone);
    
    if(user) {
        user.name = name;
        if(isPlus) {
            user.isPlus = true;
            user.vipKey = vipKey;
            user.vipExpiry = Date.now() + 90*24*60*60*1000;
        }
    } else {
        user = {
            id: Date.now().toString() + Math.random().toString(36).slice(2,9),
            name,
            phone: fullPhone,
            isPlus: isPlus || false,
            vipKey: isPlus ? vipKey : null,
            vipExpiry: isPlus ? Date.now() + 90*24*60*60*1000 : null,
            createdAt: Date.now()
        };
        data.users.push(user);
    }
    
    await writeData(data);
    currentUser = user;
    localStorage.setItem('arbuz_user', JSON.stringify(currentUser));
    
    const navTitle = document.getElementById('navTitle');
    if(navTitle) navTitle.textContent = isPlus ? '🍉⭐ Арбуз Плюс' : '🍉 Арбуз';
    
    showScreen('chatsScreen');
    toast('Регистрация успешна!', 'success');
}

// Загрузка чатов
async function loadChats() {
    if(!currentUser) {
        const saved = localStorage.getItem('arbuz_user');
        if(saved) currentUser = JSON.parse(saved);
        else return;
    }
    
    const data = await readData();
    const list = document.getElementById('chatsList');
    if(!list) return;
    
    const userChats = data.chats.filter(c => c.participants.includes(currentUser.id));
    
    if(userChats.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Нет чатов. Используйте поиск.</div>';
        return;
    }
    
    list.innerHTML = userChats.map(c => {
        const otherId = c.participants.find(id => id !== currentUser.id);
        const otherUser = data.users.find(u => u.id === otherId);
        const chatMsgs = data.messages.filter(m => m.chatId === c.id);
        const lastMsg = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length-1] : null;
        
        return `
            <div class="list-item" onclick="openChat('${c.id}','${otherUser?.id||''}','${otherUser?.name||'?'}','${otherUser?.phone||''}')">
                <div class="avatar ${otherUser?.isPlus ? 'gold' : ''}">${(otherUser?.name||'?')[0]}</div>
                <div class="item-info">
                    <div class="item-name">${otherUser?.name||'?'} ${otherUser?.isPlus ? '⭐' : ''}</div>
                    <div class="item-sub">${lastMsg ? lastMsg.text : otherUser?.phone||''}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Поиск
async function searchUsers() {
    const q = document.getElementById('searchInput')?.value.replace(/\D/g,'') || '';
    if(q.length < 3) { loadChats(); return; }
    
    const data = await readData();
    const list = document.getElementById('chatsList');
    if(!list) return;
    
    const found = data.users.filter(u => u.phone.includes(q) && u.id !== currentUser?.id);
    
    if(found.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Не найдено</div>';
        return;
    }
    
    list.innerHTML = found.map(u => `
        <div class="list-item" onclick="startChat('${u.id}')">
            <div class="avatar ${u.isPlus ? 'gold' : ''}">${u.name[0]}</div>
            <div class="item-info">
                <div class="item-name">${u.name} ${u.isPlus ? '⭐' : ''}</div>
                <div class="item-sub">${u.phone}</div>
            </div>
        </div>
    `).join('');
}

// Создать чат
async function startChat(userId) {
    const data = await readData();
    const chatId = [currentUser.id, userId].sort().join('_');
    
    if(!data.chats.find(c => c.id === chatId)) {
        data.chats.push({
            id: chatId,
            participants: [currentUser.id, userId],
            createdAt: Date.now()
        });
        await writeData(data);
    }
    
    loadChats();
}

// Открыть чат
function openChat(chatId, userId, name, phone) {
    currentChat = { chatId, userId, name, phone };
    
    const av = document.getElementById('chatAv');
    const nameEl = document.getElementById('chatName');
    const phoneEl = document.getElementById('chatPhone');
    
    if(av) av.textContent = name[0] || '?';
    if(nameEl) nameEl.textContent = name;
    if(phoneEl) phoneEl.textContent = phone;
    
    showScreen('chatScreen');
    loadMessages();
    
    if(updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(loadMessages, 2000);
}

// Загрузка сообщений
async function loadMessages() {
    if(!currentChat) return;
    
    const data = await readData();
    const list = document.getElementById('messagesList');
    if(!list) return;
    
    const msgs = data.messages.filter(m => m.chatId === currentChat.chatId);
    
    if(msgs.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Нет сообщений</div>';
        return;
    }
    
    list.innerHTML = msgs.map(m => `
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
    if(!input) return;
    
    const text = input.value.trim();
    if(!text || !currentChat) return;
    
    const data = await readData();
    data.messages.push({
        chatId: currentChat.chatId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        text,
        timestamp: Date.now()
    });
    
    await writeData(data);
    input.value = '';
    loadMessages();
}

// Профиль
function showProfile() {
    if(!currentUser) return;
    
    document.getElementById('profName').textContent = currentUser.name;
    document.getElementById('profPhone').textContent = currentUser.phone;
    document.getElementById('profVersion').textContent = currentUser.isPlus ? '🍉⭐ Арбуз Плюс' : '🍉 Арбуз';
    
    const expRow = document.getElementById('profExpiryRow');
    if(currentUser.isPlus && currentUser.vipExpiry) {
        if(expRow) expRow.style.display = 'flex';
        const days = Math.ceil((currentUser.vipExpiry - Date.now()) / (1000*60*60*24));
        const expEl = document.getElementById('profExpiry');
        if(expEl) expEl.textContent = days > 0 ? `${days} дней` : 'Истёк';
    } else {
        if(expRow) expRow.style.display = 'none';
    }
    
    showScreen('profileScreen');
}

// Выход
function logout() {
    if(updateInterval) clearInterval(updateInterval);
    localStorage.removeItem('arbuz_user');
    currentUser = null;
    currentChat = null;
    showScreen('chooseScreen');
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', function() {
    // Кнопки выбора версии
    document.getElementById('cardFree')?.addEventListener('click', () => showScreen('registerFree'));
    document.getElementById('cardPlus')?.addEventListener('click', () => showScreen('registerPlus'));
    
    // Кнопки назад
    document.getElementById('backFree')?.addEventListener('click', () => showScreen('chooseScreen'));
    document.getElementById('backPlus')?.addEventListener('click', () => showScreen('chooseScreen'));
    
    // Кнопки регистрации
    document.getElementById('btnRegFree')?.addEventListener('click', () => register(false));
    document.getElementById('btnRegPlus')?.addEventListener('click', () => register(true));
    
    // Поиск
    document.getElementById('searchInput')?.addEventListener('input', searchUsers);
    
    // Отправка сообщения
    document.getElementById('sendBtn')?.addEventListener('click', sendMessage);
    document.getElementById('msgInput')?.addEventListener('keypress', function(e) {
        if(e.key === 'Enter') sendMessage();
    });
    
    // Выход
    document.getElementById('btnLogout')?.addEventListener('click', logout);
    
    // Профиль
    document.getElementById('btnProfile')?.addEventListener('click', showProfile);
    document.getElementById('btnBackProfile')?.addEventListener('click', () => showScreen('chatsScreen'));
    
    // Назад из чата
    document.getElementById('btnBack')?.addEventListener('click', function() {
        if(updateInterval) clearInterval(updateInterval);
        showScreen('chatsScreen');
        loadChats();
    });
});

// Инициализация
const saved = localStorage.getItem('arbuz_user');
if(saved) {
    currentUser = JSON.parse(saved);
    setTimeout(() => {
        showScreen('chatsScreen');
        const navTitle = document.getElementById('navTitle');
        if(navTitle) navTitle.textContent = currentUser.isPlus ? '🍉⭐ Арбуз Плюс' : '🍉 Арбуз';
    }, 100);
                                                                     }
