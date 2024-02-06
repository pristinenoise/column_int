const fs = require("fs");
const path = require("path");
const client = require("./client.js");
const database = require("./database.js");
const trie = require("./trie.js");
const deprecated = require("./deprecated.js");
let files = [];

function getFilesRecursively(directory, files = []) {
  database.cleanDatabase();
  const filesInDirectory = fs.readdirSync(directory);
  for (const file of filesInDirectory) {
    const absolute = path.join(directory, file);
    if (fs.statSync(absolute).isDirectory()) {
      getFilesRecursively(absolute, files);
    } else {
      files.push(absolute);
    }
  }

  return files;
}

// This function will let us define what counts as a valid token.
// Starting with only two letters or greater
function validToken(token) {
  return token.length > 1;
}

// This is pretty naive tokenizer, but can be improved later.
// returns an object with the token as the key and number of occurrences as the value
function tokenizeData(data) {
  const tokens = data.split(/\W+/).map((token) => token.toLowerCase());

  const tokenMap = tokens.reduce((acc, token) => {
    if (!validToken(token)) {
      return acc;
    }

    if (acc[token]) {
      acc[token] += 1;
    } else {
      acc[token] = 1;
    }
    return acc;
  }, {});

  return tokenMap;
}

function processCorpusDirectory(relativeDir) {
  const absoluteDir = path.resolve(__dirname, relativeDir);
  const fileList = getFilesRecursively(absoluteDir);

  // database.cleanDatabase();
  // const dbTrie = trie.dbBasedTrie();
  const trie = deprecated.nonRecursiveTrie();

  // we're using file indexes to refer to files in the trie
  // so we can save memory
  fileList.forEach((file, fileIndex) => {
    console.log(`Processing file #${fileIndex}: ${file}`);

    const fileData = fs.readFileSync(file, "utf8");
    const tokens = tokenizeData(fileData);

    Object.entries(tokens).forEach(([token, tokenCount]) => {
      trie.add(token, tokenCount, fileIndex);
    });
  });

  return trie;
}

const processedTrie = processCorpusDirectory("../data/test_corpus");
console.log(processedTrie.search("lor"));
