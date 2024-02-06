// Including this file to show the earlier attempts at in-memory tries
// which all run out of memory about 500,000 files in.
const nonRecursiveTrie = () => {
  const children = {};
  const countByFile = {};
  const totalTokens = 0;

  const add = (token, tokenCount, fileIndex) => {
    let activeNode = undefined;
    let activeChildren = children;
    for (let idx = 0; idx < token.length; idx++) {
      if (!activeChildren[token[idx]]) {
        activeChildren[token[idx]] = {
          children: {},
          countByFile: {},
          totalTokens: 0,
        };
      }

      activeNode = activeChildren[token[idx]];
      activeChildren = activeNode.children;
    }

    activeNode.totalTokens += tokenCount;
    activeNode.countByFile[fileIndex] = tokenCount;
  };

  const search = (token) => {
    // don't return searches on less than 2 characters.
    if (token.length < 2) {
      return [];
    }

    let activeNode = undefined;
    let activeChildren = children;

    for (let idx = 0; idx < token.length; idx++) {
      if (!activeChildren[token[idx]]) {
        return [];
      }

      activeNode = activeChildren[token[idx]];
      activeChildren = activeNode.children;
    }

    // scoring algorithm to determine which files are best to show
    const exactScore = {};
    const prefixScore = {};
    let totalPrefixedTokens = 0;

    console.log(activeNode);
    Object.entries(activeNode.countByFile).forEach(
      ([fileIndex, tokenCount]) => {
        exactScore[fileIndex] = tokenCount / (activeNode.totalTokens * 1.0);
      }
    );

    const queue = [];
    queue.push(activeNode);

    while (queue.length > 0) {
      const nodeToProcess = queue.pop();
      totalPrefixedTokens += nodeToProcess.totalTokens;

      Object.entries(nodeToProcess.countByFile).forEach(
        ([fileIndex, tokenCount]) => {
          if (prefixScore[fileIndex]) {
            prefixScore[fileIndex] += tokenCount;
          } else {
            prefixScore[fileIndex] = tokenCount;
          }
        }
      );

      queue.push(...Object.values(nodeToProcess.children));
    }

    const combinedScore = {};

    // how much more do we value exact matches than prefix matches
    const VALUE_EXACT_MULTIPLIER = 5.0;

    Object.entries(exactScore).forEach(([fileIndex, score]) => {
      const points = score * VALUE_EXACT_MULTIPLIER;

      combinedScore[fileIndex] = points;
    });

    Object.entries(prefixScore).forEach(([fileIndex, numTokens]) => {
      const points = numTokens / (totalPrefixedTokens * 1.0);

      if (combinedScore[fileIndex]) {
        combinedScore[fileIndex] += points;
      } else {
        combinedScore[fileIndex] = points;
      }
    });

    const sortedResults = Object.entries(combinedScore).sort(
      (a, b) => b[1] - a[1]
    );
    return {
      exactScore: exactScore,
      totalPrefixedTokens: totalPrefixedTokens,
      combinedScore: combinedScore,
      prefixScore: prefixScore,
      sortedResults: sortedResults,
    };
  };

  return {
    countByFile,
    totalTokens,
    children,
    add,
    search,
  };
};

module.exports = { nonRecursiveTrie };
