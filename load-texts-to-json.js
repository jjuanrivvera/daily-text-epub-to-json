'use strict';
require("dotenv").config();
const fs = require("fs");
const path = require('path');
const sanitizeHtml = require('sanitize-html');

/* -------------------------------------------
 * Initialize Mongo vars.
 --------------------------------------------- */
const dsn = process.env.MONGO_DSN;
const mongoose = require("mongoose");
mongoose.connect(dsn, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


/* -------------------------------------------
 * Extract the reference of the daily text.
 --------------------------------------------- */
const setReference = (textObject) => {
    let explanation = textObject.explanation;
    let indexOfReference = explanation.search(" w");

    return explanation.substring(indexOfReference + 1, explanation.length);
}

/* -------------------------------------------
 * Format date YYYY-MM-DD.
 --------------------------------------------- */
const setDate = (textObject) => {
    let months = {
        enero: "01",
        febrero: "02",
        marzo: "03",
        abril: "04",
        mayo: "05",
        junio: "06",
        julio: "07",
        agosto: "08",
        septiembre: "09",
        octubre: "10",
        noviembre: "11",
        diciembre: "12"
    };

    let date = textObject.date;

    //Extract day number
    let day = date.match(/\d/g);
    day = day.join("");

    if (day.length === 1) {
        day = "0" + day;
    }

    //Resolve month number
    let month = months[date.slice(date.lastIndexOf(' ') + 1)];

    let year = process.env.YEAR;

    return `${year}-${month}-${day}`;
}


/* -------------------------------------------
 * Organize the text.
 * Separates the text content and reference.
 --------------------------------------------- */
const completeText = (textObject) => {
    let text = textObject.textContent;
    let indexOfText = text.search(/\(/);

    textObject.text = text.substring(indexOfText, text.length); // Get the text reference... example: "(Mat 3:5)."
    textObject.textContent = text.replace(" " + textObject.text, "."); // Get the text content

    return textObject;
}


/* -------------------------------------------
 * Took the xhtml content and extract the info.
 --------------------------------------------- */
const formatText = (content) => {
    //Removes all html and xml tags
    let text = sanitizeHtml(content, {
        allowedTags: [],
        allowedAttributes: {}
    });

    //Delete lines starting with ^
    text = text.replace(/^.*\^.*$/mg, "");

    // Weird fix for first day of month
    text = text.replace(/^.*Enero.*$/mg, "");
    text = text.replace(/^.*Febrero.*$/mg, "");
    text = text.replace(/^.*Marzo.*$/mg, "");
    text = text.replace(/^.*Abril.*$/mg, "");
    text = text.replace(/^.*Mayo.*$/mg, "");
    text = text.replace(/^.*Junio.*$/mg, "");
    text = text.replace(/^.*Julio.*$/mg, "");
    text = text.replace(/^.*Agosto.*$/mg, "");
    text = text.replace(/^.*Septiembre.*$/mg, "");
    text = text.replace(/^.*Octubre.*$/mg, "");
    text = text.replace(/^.*Noviembre.*$/mg, "");
    text = text.replace(/^.*Diciembre.*$/mg, "");

    //Delete empty lines
    text = text.replace(/^\s*[\r\n]/gm, "");

    // break the textblock into an array of lines
    let lines = text.split('\r');
    //console.log(lines);

    let TextObject = {
        date: lines[1],
        text: "",
        textContent: lines[2],
        explanation: lines[3],
        reference: ""
    };

    TextObject.reference = setReference(TextObject);
    TextObject.explanation = TextObject.explanation.replace(" " + TextObject.reference, "");
    TextObject.date = setDate(TextObject);
    TextObject = completeText(TextObject);

    return TextObject;
}

//Read all xhtml files from OEBPS folder and convert them to JSON
fs.readdir("./Lab/OEBPS/", (err, files) => {
    let jsFiles = files.filter((f) => f.split(".").pop() === "xhtml");
    let texts = [];

    jsFiles.forEach((file, index) => {
        if (file.includes('extracted')) {
            return;
        }

        console.log(file);

        try {
            let content = fs.readFileSync(path.join(__dirname, 'Lab', 'OEBPS', file), 'utf8');

            let textObject = formatText(content);
            texts.push(textObject);
        } catch (err) {
            console.log(err);
        }

    });

    console.log(texts.length);

    fs.writeFileSync('output.json', JSON.stringify(texts));
});