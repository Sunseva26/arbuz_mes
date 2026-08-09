// GitHub конфигурация
const GITHUB_TOKEN = "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";
const GITHUB_USER = "Sunseva26";
const GITHUB_REPO = "arbuz-messenger";
const GITHUB_PATH = "db.json";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;

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
    try {
        let r = await fetch(GITHUB_API, {
            headers: { "Authorization": "Bearer " + GITHUB_TOKEN }
        });
        let d = await r.json();
        let content = atob(d.content);
        return JSON.parse(content);
    } catch(e) {
        console.error("Ошибка чтения:", e);
        return { users: [], chats: [], messages: [] };
    }
}

async function write(record) {
    try {
        let r = await fetch(GITHUB_API, {
            headers: { "Authorization": "Bearer " + GITHUB_TOKEN }
        });
        let d = await r.json();
        let sha = d.sha;
        
        let content = btoa(JSON.stringify(record, null, 2));
        
        await fetch(GITHUB_API, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + GITHUB_TOKEN,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "update db",
                content: content,
                sha: sha
            })
        });
    } catch(e) {
        console.error("Ошибка записи:", e);
    }
}

function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'chatsScreen') loadChats();
}

function toast(msg, type) {
    let t = document.getElementById('toast');
    if(!t) return;
    t.textContent = msg;
    t.className = 'toast show ' + (type||'error');
    setTimeout(() => t.classList.remove('show'), 3000);
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
    let name = document.getElementById(isPlus ? 'regNamePlus' : 'regNameFree').value.trim();
    let phone = document.getElementById(isPlus ? 'regPhonePlus' : 'regPhoneFree').value.replace(/\D/g,'');
    let vipKey = isPlus ? document.getElementById('regVipKey').value.trim().toUpperCase() : null;
    
    if(!name) { toast('Введите имя'); return; }
    if(phone.length !== 10) { toast('Введите 10 цифр'); return; }
    if(isPlus && !VIP_KEYS.includes(vipKey)) { toast('Неверный ключ'); return; }
    
    let data = await read();
    let user = data.users.find(u => u.phone === '+7'+phone);
    
    if(user) {
        user.name = name;
        if(isPlus) { user.isPlus = true; user.vipKey = vipKey; user.vipExpiry = Date.now() + 90*24*60*60*1000; }
    } else {
        user = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2,7),
            name, phone: '+7'+phone,
            isPlus: isPlus || false,
            vipKey: isPlus ? vipKey : null,
            vipExpiry: isPlus ? Date.now() + 90*24*60*60*1000 : null,
            createdAt: Date.now()
        };
        data.users.push(user);
    }
    
    await write(data);
    currentUser = user;
    localStorage.setItem('arbuz_user', JSON.stringify(user));
    document.getElementById('navTitle').textContent = isPlus ? '🍉⭐ Арбуз Плюс' : '🍉 Арбуз';
    show('chatsScreen');
    toast('Успешно!', 'success');
}

async function loadChats() {
    if(!currentUser) {
        let s = localStorage.getItem('arbuz_user');
        if(s) currentUser = JSON.parse(s); else return;
    }
    let data = await read();
    let list = document.getElementById('chatsList');
    let chats = data.chats.filter(c => c.participants.includes(currentUser.id));
    
    if(!chats.length) {
        list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Нет чатов</div>';
        return;
    }
    
    list.innerHTML = chats.map(c => {
        let otherId = c.participants.find(id => id !== currentUser.id);
        let u = data.users.find(x => x.id === otherId);
        let msgs = data.messages.filter(m => m.chatId === c.id);
        let last = msgs.length ? msgs[msgs.length-1].text : '';
        return `<div class="list-item" onclick="openChat('${c.id}','${u.id}','${u.name}','${u.phone}')">
            <div class="avatar ${u.isPlus?'gold':''}">${u.name[0]}</div>
            <div class="item-info"><div class="item-name">${u.name} ${u.isPlus?'⭐':''}</div><div class="item-sub">${last||u.phone}</div></div>
        </div>`;
    }).join('');
}

async function searchUsers() {
    let q = document.getElementById('searchInput').value.replace(/\D/g,'');
    if(q.length < 3) { loadChats(); return; }
    let data = await read();
    let list = document.getElementById('chatsList');
    let found = data.users.filter(u => u.phone.includes(q) && u.id !== currentUser.id);
    
    if(!found.length) { list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Не найдено</div>'; return; }
    
    list.innerHTML = found.map(u => `<div class="list-item" onclick="startChat('${u.id}')">
        <div class="avatar ${u.isPlus?'gold':''}">${u.name[0]}</div>
        <div class="item-info"><div class="item-name">${u.name} ${u.isPlus?'⭐':''}</div><div class="item-sub">${u.phone}</div></div>
    </div>`).join('');
}

async function startChat(userId) {
    let data = await read();
    let chatId = [currentUser.id, userId].sort().join('_');
    if(!data.chats.find(c => c.id === chatId)) {
        data.chats.push({ id: chatId, participants: [currentUser.id, userId], createdAt: Date.now() });
        await write(data);
    }
    loadChats();
}

function openChat(chatId, userId, name, phone) {
    currentChat = { chatId, userId, name, phone };
    document.getElementById('chatAv').textContent = name[0];
    document.getElementById('chatName').textContent = name;
    document.getElementById('chatPhone').textContent = phone;
    show('chatScreen');
    loadMessages();
    if(timer) clearInterval(timer);
    timer = setInterval(loadMessages, 2000);
}

async function loadMessages() {
    if(!currentChat) return;
    let data = await read();
    let list = document.getElementById('messagesList');
    let msgs = data.messages.filter(m => m.chatId === currentChat.chatId);
    
    if(!msgs.length) { list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Нет сообщений</div>'; return; }
    
    list.innerHTML = msgs.map(m => `<div class="message ${m.senderId===currentUser.id?'sent':'received'}">
        ${m.text}<div class="msg-time">${new Date(m.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
    </div>`).join('');
    list.scrollTop = list.scrollHeight;
}

async function sendMessage() {
    let input = document.getElementById('msgInput');
    let text = input.value.trim();
    if(!text || !currentChat) return;
    let data = await read();
    data.messages.push({ chatId: currentChat.chatId, senderId: currentUser.id, senderName: currentUser.name, text, timestamp: Date.now() });
    await write(data);
    input.value = '';
    loadMessages();
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('cardFree').onclick = () => show('registerFree');
    document.getElementById('cardPlus').onclick = () => show('registerPlus');
    document.getElementById('backFree').onclick = () => show('chooseScreen');
    document.getElementById('backPlus').onclick = () => show('chooseScreen');
    document.getElementById('btnRegFree').onclick = () => register(false);
    document.getElementById('btnRegPlus').onclick = () => register(true);
    document.getElementById('searchInput').oninput = searchUsers;
    document.getElementById('sendBtn').onclick = sendMessage;
    document.getElementById('msgInput').onkeypress = e => { if(e.key==='Enter') sendMessage(); };
    document.getElementById('btnBack').onclick = () => { if(timer)clearInterval(timer); show('chatsScreen'); loadChats(); };
    
    let saved = localStorage.getItem('arbuz_user');
    if(saved) { currentUser = JSON.parse(saved); show('chatsScreen'); }
});
