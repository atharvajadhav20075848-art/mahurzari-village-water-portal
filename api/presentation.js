const presentationHtml = require('./presentationHtml');

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(presentationHtml);
};
