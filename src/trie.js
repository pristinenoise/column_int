const database = require("./database.js");

const dbBasedTrie = () => {
  const add = (token, tokenCount, fileIndex) => {
    let lastRowId = -1;
    for (let idx = 0; idx < token.length; idx++) {
      const partialToken = token.slice(0, idx + 1);
      lastRowId = database.findOrCreateTrieNode(lastRowId, partialToken);
    }

    database.addFileCountRow(lastRowId, tokenCount, fileIndex);
  };

  return {
    add,
  };
};

module.exports = {
  dbBasedTrie,
};
