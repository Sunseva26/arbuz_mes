const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    const { name, phone, isPlus, vipKey } = JSON.parse(event.body);
    const dataPath = path.join(__dirname, '../../data/users.json');
    const users = JSON.parse(fs.readFileSync(dataPath));
    
    const user = {
        id: Date.now().toString(),
        name,
        phone,
        isPlus: isPlus || false,
        vipKey: vipKey || null,
        vipExpiry: isPlus ? Date.now() + 90*24*60*60*1000 : null,
        createdAt: Date.now()
    };
    
    users.push(user);
    fs.writeFileSync(dataPath, JSON.stringify(users, null, 2));
    
    return { statusCode: 200, body: JSON.stringify({ success: true, user }) };
};
