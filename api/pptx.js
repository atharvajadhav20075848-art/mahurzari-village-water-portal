const pptxB64 = require('./pptxBase64');

module.exports = (req, res) => {
  const buf = Buffer.from(pptxB64, 'base64');
  res.writeHead(200, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'Content-Length': buf.length,
    'Content-Disposition': 'attachment; filename="Mahurzari_Water_Portal_Presentation.pptx"'
  });
  res.end(buf);
};
