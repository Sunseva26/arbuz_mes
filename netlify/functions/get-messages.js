const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    const { chatId } = JSON.parse(event.body);
    const msgPath = path.join(__dirname, '../../data/messages.json');
    const messages = JSON.parse(fs.readFileSync(msgPath));
    
    const chatMessages = messages.filter(m => m.chatId === chatId);
    
    return { statusCode: 200, body: JSON.stringify({ messages: chatMessages }) };
};
