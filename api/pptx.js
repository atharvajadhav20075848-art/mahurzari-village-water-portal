const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const candidates = [
    path.join(__dirname, '..', 'Mahurzari_Water_Portal_Presentation.pptx'),
    path.join(__dirname, '..', 'public', 'Mahurzari_Water_Portal_Presentation.pptx'),
    path.join(__dirname, '..', 'dist', 'Mahurzari_Water_Portal_Presentation.pptx'),
    path.join(process.cwd(), 'Mahurzari_Water_Portal_Presentation.pptx'),
    path.join(process.cwd(), 'public', 'Mahurzari_Water_Portal_Presentation.pptx'),
    path.join(process.cwd(), 'dist', 'Mahurzari_Water_Portal_Presentation.pptx')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const stat = fs.statSync(p);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="Mahurzari_Water_Portal_Presentation.pptx"'
      });
      const readStream = fs.createReadStream(p);
      return readStream.pipe(res);
    }
  }

  res.status(404).send('PPTX file not found in build directory.');
};
