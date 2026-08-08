const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    const { userId } = JSON.parse(event.body);
    const chatsPath = path.join(__dirname, '../../data/chats.json');
    const usersPath = path.join(__dirname, '../../data/users.json');
    const msgPath = path.join(__dirname, '../../data/messages.json');
    
    const chats = JSON.parse(fs.readFileSync(chatsPath));
    const users = JSON.parse(fs.readFileSync(usersPath));
    const messages = JSON.parse(fs.readFileSync(msgPath));
    
    const userChats = chats.filter(c => c.participants.includes(userId));
    
    const result = userChats.map(c => {
        const otherId = c.participants.find(id => id !== userId);
        const otherUser = users.find(u => u.id === otherId);
        const lastMsg = messages.filter(m => m.chatId === c.id).pop();
        
        return {
            chatId: c.id,
            user: otherUser || { name: '?', phone: '?' },
            lastMessage: lastMsg ? lastMsg.text : ''
        };
    });
    
    return { statusCode: 200, body: JSON.stringify({ chats: result }) };
};
