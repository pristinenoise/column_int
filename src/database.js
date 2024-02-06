const db = require("better-sqlite3")("trie.db", undefined);

function cleanDatabase() {
  db.prepare("DROP TABLE IF EXISTS trie").run();
  db.prepare("DROP TABLE IF EXISTS trie_file_count").run();
  db.prepare("CREATE TABLE trie (parent_id INTEGER, word TEXT)").run();
  db.prepare(
    "CREATE TABLE trie_file_count (trie_id INTEGER, token_count INTEGER, file_index INTEGER)"
  ).run();
}

function findOrCreateTrieNode(parentId, word) {
  const row = db.prepare("SELECT * FROM trie WHERE word = ?").get(word);
  if (row === undefined) {
    const result = db
      .prepare("INSERT INTO trie (parent_id, word) VALUES (@parentId, @word)")
      .run({ parentId, word });
    return result.lastInsertRowid;
  } else {
    return row.parent_id;
  }
}

function fetchMatches(token) {
  const exactRow = db
    .prepare("SELECT rowid, * FROM trie WHERE word = ?")
    .get(token);
  if (exactRow === undefined) {
    return undefined;
  }

  const queue = [exactRow.rowid];
  console.log("exact", exactRow);
  console.log("queue", queue);

  const prefixIds = [];

  while (queue.length > 0) {
    const currId = queue.pop();
    const rows = db
      .prepare("SELECT rowid, * FROM trie WHERE parent_id = ?")
      .all(currId);
    const rowIds = rows.map((row) => row.rowid);
    queue.push(...rowIds);
    prefixIds.push(...rowIds);
  }

  exactMatches = db
    .prepare("SELECT * FROM trie_file_count WHERE trie_id = ?")
    .get(exactRow.rowid);

  prefixMatches = db
    .prepare(
      `SELECT * FROM trie_file_count WHERE trie_id IN (${prefixIds
        .map(() => "?")
        .join(", ")})`
    )
    .get(...prefixIds);

  return {
    exactMatch: exactMatches,
    prefixMatches: prefixMatches,
  };
}

function addFileCountRow(trieId, tokenCount, fileIndex) {
  const result = db
    .prepare(
      "INSERT INTO trie_file_count (trie_id, token_count, file_index) VALUES (@trieId, @tokenCount, @fileIndex)"
    )
    .run({ trieId, tokenCount, fileIndex });
}

function addRow(parentId, word, count, fileIndex) {
  db.serialize(() => {
    const stmt = db.execute(
      "INSERT INTO trie VALUES (?, ?, ?, ?)",
      parentId,
      word,
      count,
      fileIndex
    );
  });
}
module.exports = {
  db,
  findOrCreateTrieNode,
  fetchMatches,
  cleanDatabase,
  addFileCountRow,
  addRow,
};
