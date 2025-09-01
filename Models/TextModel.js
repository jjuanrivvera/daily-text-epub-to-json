const mongoose = require('mongoose');

const textSchema = new mongoose.Schema({
  date: 'string',
  text: 'string',
  textContent: 'string',
  explanation: 'string',
  reference: 'string',
});

exports = mongoose.model('text', textSchema);
