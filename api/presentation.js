const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  const candidates = [
    path.join(__dirname, '..', 'public', 'presentation.html'),
    path.join(__dirname, '..', 'dist', 'presentation.html'),
    path.join(__dirname, '..', 'presentation.html'),
    path.join(process.cwd(), 'public', 'presentation.html'),
    path.join(process.cwd(), 'dist', 'presentation.html'),
    path.join(process.cwd(), 'presentation.html')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const html = fs.readFileSync(p, 'utf-8');
      return res.status(200).send(html);
    }
  }

  res.status(404).send('Presentation file not found in build directory.');
};
