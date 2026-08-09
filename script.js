const GITHUB_TOKEN = "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";
const GITHUB_USER = "Sunseva26";
const GITHUB_REPO = "arbuz-messenger";
const GITHUB_PATH = "db.json";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
const BOT_TOKEN = "8691888263:AAG8jEOWAo5dNQOkzvpDskeqCfxT3iHKZrk";
const BOT_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const BOT_USERNAME = "codecap_bot";

let currentUser = null;
let currentChat = null;
let timer = null;
let pendingPhone = null;
let pendingCode = null;
let pendingName = null;
let pendingIsPlus = null;
let pendingVipKey = null;

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
        let r = await fetch(GITHUB_API, { headers: { "Authorization": "Bearer " + GITHUB_TOKEN } });
        let d = await r.json();
        return JSON.parse(atob(d.content));
    } catch(e) { return { users: [], chats: [], messages: [] }; }
}

async function write(record) {
    try {
        let r = await fetch(GITHUB_API, { headers: { "Authorization": "Bearer " + GITHUB_TOKEN } });
        let sha = (await r.json()).sha;
        await fetch(GITHUB_API, {
            method: "PUT",
            headers: { "Authorization": "Bearer " + GITHUB_TOKEN, "Content-Type": "application/json" },
            body: JSON.stringify({ message: "update", content: btoa(JSON.stringify(record, null, 2)), sha })
        });
    } catch(e) {}
}

function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'chatsScreen') loadChats();
}

function toast(msg, type) {
    let t = document.getElementById('toast');
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

async function getUserChatId(phone) {
    try {
        let r = await fetch(`${BOT_URL}/getUpdates`);
        let d = await r.json();
        if(d.result) {
            for(let u of d.result) {
                if(u.message && u.message.text === phone) {
                    return u.message.chat.id;
                }
            }
        }
        return null;
    } catch(e) { return null; }
}

async function sendCodeToTelegram(phone, code) {
    let chatId = await getUserChatId(phone);
    if(!chatId) {
        toast('Сначала напишите боту @' + BOT_USERNAME + ' свой номер телефона');
        return false;
    }
    try {
        await fetch(`${BOT_URL}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: `🔐 Код подтверждения для Арбуз: ${code}`
            })
        });
        return true;
    } catch(e) { return false; }
}

async function requestCode(isPlus) {
    let name = document.getElementById(isPlus ? 'regNamePlus' : 'regNameFree').value.trim();
    let phone = document.getElementById(isPlus ? 'regPhonePlus' : 'regPhoneFree').value.replace(/\D/g,'');
    let vipKey = isPlus ? document.getElementById('regVipKey').value.trim().toUpperCase() : null;
    
    if(!name) { toast('Введите имя'); return; }
    if(phone.length !== 10) { toast('Введите 10 цифр'); return; }
    if(isPlus && !VIP_KEYS.includes(vipKey)) { toast('Неверный ключ'); return; }
    
    let code = Math.floor(100000 + Math.random() * 900000).toString();
    pendingCode = code;
    pendingPhone = phone;
    pendingName = name;
    pendingIsPlus = isPlus;
    pendingVipKey = vipKey;
    
    let sent = await sendCodeToTelegram(phone, code);
    if(sent) {
        document.getElementById(isPlus ? 'codeBlockPlus' : 'codeBlockFree').classList.remove('hidden');
        document.getElementById(isPlus ? 'btnRegPlus' : 'btnRegFree').classList.add('hidden');
        toast('Код отправлен в Telegram!', 'success');
    }
}

async function confirmCode(isPlus) {
    let codeInput = document.getElementById(isPlus ? 'codePlus' : 'codeFree').value.trim();
    if(codeInput !== pendingCode) { toast('Неверный код'); return; }
    await register();
}

async function register() {
    let data = await read();
    let user = data.users.find(u => u.phone === '+7'+pendingPhone);
    
    if(user) {
        user.name = pendingName;
        if(pendingIsPlus) { user.isPlus = true; user.vipKey = pendingVipKey; user.vipExpiry = Date.now() + 90*24*60*60*1000; }
    } else {
        user = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2,7),
            name: pendingName, phone: '+7'+pendingPhone,
            isPlus: pendingIsPlus || false,
            vipKey: pendingIsPlus ? pendingVipKey : null,
            vipExpiry: pendingIsPlus ? Date.now() + 90*24*60*60*1000 : null,
            createdAt: Date.now()
        };
        data.users.push(user);
    }
    
    await write(data);
    currentUser = user;
    localStorage.setItem('arbuz_user', JSON.stringify(user));
    document.getElementById('navTitle').textContent = pendingIsPlus ? '🍉⭐ Арбуз Плюс' : '🍉 Арбуз';
    pendingPhone = null; pendingCode = null; pendingName = null;
    show('chatsScreen');
    toast('Вход выполнен!', 'success');
}

async function loadChats() {
    if(!currentUser) { let s = localStorage.getItem('arbuz_user'); if(s) currentUser = JSON.parse(s); else return; }
    let data = await read();
    let list = document.getElementById('chatsList');
    let chats = data.chats.filter(c => c.participants.includes(currentUser.id));
    if(!chats.length) { list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Нет чатов. Ищите людей через поиск.</div>'; return; }
    list.innerHTML = chats.map(c => {
        let otherId = c.participants.find(id => id !== currentUser.id);
        let u = data.users.find(x => x.id === otherId);
        if(!u) return '';
        let msgs = data.messages.filter(m => m.chatId === c.id);
        let last = msgs.length ? msgs[msgs.length-1].text : '';
        return `<div class="list-item" onclick="openChat('${c.id}','${u.id}','${u.name}','${u.phone}')"><div class="avatar ${u.isPlus?'gold':''}">${u.name[0]}</div><div class="item-info"><div class="item-name">${u.name} ${u.isPlus?'⭐':''}</div><div class="item-sub">${last||u.phone}</div></div></div>`;
    }).join('');
}

async function searchUsers() {
    let q = document.getElementById('searchInput').value.toLowerCase().trim();
    if(q.length < 1) { loadChats(); return; }
    let data = await read();
    let list = document.getElementById('chatsList');
    let found = data.users.filter(u => u.id !== currentUser.id && (u.phone.includes(q.replace(/\D/g,'')) || u.name.toLowerCase().includes(q)));
    if(!found.length) { list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Не найдено</div>'; return; }
    list.innerHTML = found.map(u => `<div class="list-item" onclick="startChat('${u.id}')"><div class="avatar ${u.isPlus?'gold':''}">${u.name[0]}</div><div class="item-info"><div class="item-name">${u.name} ${u.isPlus?'⭐':''}</div><div class="item-sub">${u.phone}</div></div></div>`).join('');
}

async function startChat(userId) {
    let data = await read();
    let chatId = [currentUser.id, userId].sort().join('_');
    if(!data.chats.find(c => c.id === chatId)) { data.chats.push({ id: chatId, participants: [currentUser.id, userId], createdAt: Date.now() }); await write(data); }
    loadChats();
}

function openChat(chatId, userId, name, phone) {
    currentChat = { chatId, userId, name, phone };
    document.getElementById('chatAv').textContent = name[0];
    document.getElementById('chatName').textContent = name;
    document.getElementById('chatPhone').textContent = phone;
    show('chatScreen'); loadMessages();
    if(timer) clearInterval(timer);
    timer = setInterval(loadMessages, 2000);
}

async function loadMessages() {
    if(!currentChat) return;
    let data = await read();
    let list = document.getElementById('messagesList');
    let msgs = data.messages.filter(m => m.chatId === currentChat.chatId);
    if(!msgs.length) { list.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;">Нет сообщений</div>'; return; }
    list.innerHTML = msgs.map(m => `<div class="message ${m.senderId===currentUser.id?'sent':'received'}">${m.text}<div class="msg-time">${new Date(m.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div></div>`).join('');
    list.scrollTop = list.scrollHeight;
}

async function sendMessage() {
    let input = document.getElementById('msgInput');
    let text = input.value.trim();
    if(!text || !currentChat) return;
    let data = await read();
    data.messages.push({ chatId: currentChat.chatId, senderId: currentUser.id, senderName: currentUser.name, text, timestamp: Date.now() });
    await write(data);
    input.value = ''; loadMessages();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('cardFree').onclick = () => show('registerFree');
    document.getElementById('cardPlus').onclick = () => show('registerPlus');
    document.getElementById('backFree').onclick = () => show('chooseScreen');
    document.getElementById('backPlus').onclick = () => show('chooseScreen');
    document.getElementById('btnRegFree').onclick = () => requestCode(false);
    document.getElementById('btnRegPlus').onclick = () => requestCode(true);
    document.getElementById('confirmFree').onclick = () => confirmCode(false);
    document.getElementById('confirmPlus').onclick = () => confirmCode(true);
    document.getElementById('searchInput').oninput = searchUsers;
    document.getElementById('sendBtn').onclick = sendMessage;
    document.getElementById('msgInput').onkeypress = e => { if(e.key==='Enter') sendMessage(); };
    document.getElementById('btnBack').onclick = () => { if(timer)clearInterval(timer); show('chatsScreen'); loadChats(); };
    document.getElementById('btnProfile').onclick = function() {
        if(!currentUser) return;
        document.getElementById('profName').textContent = currentUser.name;
        document.getElementById('profPhone').textContent = currentUser.phone;
        document.getElementById('profVersion').textContent = currentUser.isPlus ? '🍉⭐ Арбуз Плюс' : '🍉 Арбуз';
        let expRow = document.getElementById('profExpiryRow');
        if(currentUser.isPlus && currentUser.vipExpiry) { expRow.style.display = 'flex'; let days = Math.ceil((currentUser.vipExpiry - Date.now()) / (1000*60*60*24)); document.getElementById('profExpiry').textContent = days > 0 ? days + ' дней' : 'Истёк'; }
        else { expRow.style.display = 'none'; }
        show('profileScreen');
    };
    document.getElementById('btnBackProfile').onclick = () => { show('chatsScreen'); loadChats(); };
    document.getElementById('btnLogout').onclick = () => { if(timer)clearInterval(timer); localStorage.removeItem('arbuz_user'); currentUser = null; currentChat = null; show('chooseScreen'); };
    let saved = localStorage.getItem('arbuz_user');
    if(saved) { currentUser = JSON.parse(saved); show('chatsScreen'); document.getElementById('navTitle').textContent = currentUser.isPlus ? '🍉⭐ Арбуз Плюс' : '🍉 Арбуз'; }
});
