const fs = require('fs');

['classes.dex', 'classes2.dex', 'classes3.dex', 'classes4.dex', 'classes5.dex'].forEach(f => {
  if (fs.existsSync(f)) {
    const buf = fs.readFileSync(f);
    const str = buf.toString('latin1');
    const matches = str.match(/https?:\/\/[a-zA-Z0-9\-\._~:?#\[\]@!$&'()*+,;=%]+/g);
    const filtered = matches ? matches.filter(u => !u.includes('android.com') && !u.includes('w3.org') && !u.includes('apache.org') && !u.includes('google.com') && !u.includes('github.com')) : [];
    if (filtered.length > 0) {
      console.log(f, [...new Set(filtered)]);
    }
  }
});

