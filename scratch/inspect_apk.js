const fs = require('fs');

const buf = fs.readFileSync('village-water-app-debug.apk');
const str = buf.toString('utf-8');
const matches = str.match(/https?:\/\/[a-zA-Z0-9\-\._~:?#\[\]@!$&'()*+,;=%]+/g);
const nonAndroid = matches ? matches.filter(u => !u.includes('schemas.android.com') && !u.includes('w3.org')) : [];
console.log('Non-android URLs:', [...new Set(nonAndroid)]);

