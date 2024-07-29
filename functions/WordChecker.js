const fs = require('fs');

const readFileLines = filename =>
   fs.readFileSync(filename)
   .toString('UTF8')
   .split('\n');

let words = new Set();
function readWords(path) {
    for (let word of readFileLines(path)) {
        words.add(word.trim());
    }
}
function isWord(word) {
    return word.length >= 3 && words.has(word.toLowerCase());
}

module.exports = {
    isWord: isWord,
    readWords: readWords,
};