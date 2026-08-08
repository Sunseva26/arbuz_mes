const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    const { type, userId, targetId, chatId, text, senderId, senderName } = JSON.parse(event.body);
    
    if (type === 'createChat') {
        const chatsPath = path.join(__dirname, '../../data/chats.json');
        const chats = JSON.parse(fs.readFileSync(chatsPath));
        const newChatId = [userId, targetId].sort().join('_');
        
        if (!chats.find(c => c.id === newChatId)) {
            chats.push({ id: newChatId, participants: [userId, targetId], createdAt: Date.now() });
            fs.writeFileSync(chatsPath, JSON.stringify(chats, null, 2));
        }
        
        return { statusCode: 200, body: JSON.stringify({ success: true, chatId: newChatId }) };
    }
    
    if (type === 'message') {
        const msgPath = path.join(__dirname, '../../data/messages.json');
        const messages = JSON.parse(fs.readFileSync(msgPath));
        
        messages.push({ chatId, senderId, senderName, text, timestamp: Date.now() });
        fs.writeFileSync(msgPath, JSON.stringify(messages, null, 2));
        
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }
};
