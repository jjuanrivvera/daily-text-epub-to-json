'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

/* -------------------------------------------
 * Initialize Mongo vars (optional).
 --------------------------------------------- */
const dsn = process.env.MONGO_DSN;
if (dsn) {
  const mongoose = require('mongoose');
  mongoose
    .connect(dsn, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.log('MongoDB connection failed (will only save to JSON):', err.message);
    });
} else {
  console.log('No MongoDB DSN provided, will only save to JSON file');
}

/* -------------------------------------------
 * Extract the reference of the daily text.
 --------------------------------------------- */
const setReference = (textObject) => {
  const explanation = textObject.explanation;
  const indexOfReference = explanation.search(' w');

  return explanation.substring(indexOfReference + 1, explanation.length);
};

/* -------------------------------------------
 * Format date YYYY-MM-DD.
 --------------------------------------------- */
const setDate = (textObject) => {
  const months = {
    enero: '01',
    febrero: '02',
    marzo: '03',
    abril: '04',
    mayo: '05',
    junio: '06',
    julio: '07',
    agosto: '08',
    septiembre: '09',
    octubre: '10',
    noviembre: '11',
    diciembre: '12',
  };

  const date = textObject.date;

  //Extract day number
  let day = date.match(/\d/g);
  day = day.join('');

  if (day.length === 1) {
    day = `0${day}`;
  }

  //Resolve month number
  const month = months[date.slice(date.lastIndexOf(' ') + 1)];

  const year = process.env.YEAR;

  return `${year}-${month}-${day}`;
};

/* -------------------------------------------
 * Organize the text.
 * Separates the text content and reference.
 --------------------------------------------- */
const completeText = (textObject) => {
  const text = textObject.textContent;
  const indexOfText = text.search(/\(/);

  textObject.text = text.substring(indexOfText, text.length); // Get the text reference... example: "(Mat 3:5)."
  textObject.textContent = text.replace(` ${textObject.text}`, '.'); // Get the text content

  return textObject;
};

/* -------------------------------------------
 * Took the xhtml content and extract the info.
 --------------------------------------------- */
const formatText = (content) => {
  //Removes all html and xml tags
  let text = sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {},
  });

  //Delete lines starting with ^
  text = text.replace(/^.*\^.*$/gm, '');

  // Weird fix for first day of month
  text = text.replace(/^.*Enero.*$/gm, '');
  text = text.replace(/^.*Febrero.*$/gm, '');
  text = text.replace(/^.*Marzo.*$/gm, '');
  text = text.replace(/^.*Abril.*$/gm, '');
  text = text.replace(/^.*Mayo.*$/gm, '');
  text = text.replace(/^.*Junio.*$/gm, '');
  text = text.replace(/^.*Julio.*$/gm, '');
  text = text.replace(/^.*Agosto.*$/gm, '');
  text = text.replace(/^.*Septiembre.*$/gm, '');
  text = text.replace(/^.*Octubre.*$/gm, '');
  text = text.replace(/^.*Noviembre.*$/gm, '');
  text = text.replace(/^.*Diciembre.*$/gm, '');

  //Delete empty lines
  text = text.replace(/^\s*[\r\n]/gm, '');

  // break the textblock into an array of lines
  const lines = text.split('\r');
  //console.log(lines);

  let TextObject = {
    date: lines[1],
    text: '',
    textContent: lines[2],
    explanation: lines[3],
    reference: '',
  };

  TextObject.reference = setReference(TextObject);
  TextObject.explanation = TextObject.explanation.replace(` ${TextObject.reference}`, '');
  TextObject.date = setDate(TextObject);
  TextObject = completeText(TextObject);

  return TextObject;
};

//Read all xhtml files from OEBPS folder and convert them to JSON
fs.readdir('./Lab/OEBPS/', (err, files) => {
  const jsFiles = files.filter((f) => f.split('.').pop() === 'xhtml');
  const texts = [];

  jsFiles.forEach((file, _index) => {
    if (file.includes('extracted')) {
      return;
    }

    console.log(file);

    try {
      const content = fs.readFileSync(path.join(__dirname, 'Lab', 'OEBPS', file), 'utf8');

      const textObject = formatText(content);
      texts.push(textObject);
    } catch (err) {
      console.log(err);
    }
  });

  console.log(texts.length);

  fs.writeFileSync('output.json', JSON.stringify(texts));
});
