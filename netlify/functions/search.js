const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    const { query } = JSON.parse(event.body);
    const usersPath = path.join(__dirname, '../../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath));
    
    const result = users.filter(u => u.phone.includes(query));
    
    return { statusCode: 200, body: JSON.stringify({ users: result }) };
};
