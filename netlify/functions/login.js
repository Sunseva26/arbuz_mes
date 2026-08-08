const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    const { phone } = JSON.parse(event.body);
    const dataPath = path.join(__dirname, '../../data/users.json');
    const users = JSON.parse(fs.readFileSync(dataPath));
    
    const user = users.find(u => u.phone === phone);
    
    if (!user) return { statusCode: 404, body: JSON.stringify({ error: 'Пользователь не найден' }) };
    
    return { statusCode: 200, body: JSON.stringify({ success: true, user }) };
};
