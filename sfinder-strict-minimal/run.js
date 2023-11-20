// modifying original code from eight04
// instead of a CLI application, this will be an exported js function that uses 0 user input
// also, just gonna return fumen of the minimal set instead of md file

const fs = require("fs").promises;

const {decoder, encoder} = require("tetris-fumen");

const {csvToPatterns, patternsToGraph, findMinimalNodes} = require(".");

async function run(filename) {
  const data = (await fs.readFile(filename, "utf8")).trim();
  let ignoreData;
  try {
    ignoreData = await fs.readFile(".sfinder-minimal-ignore", "utf8");
  } catch (err) {
    // pass
  }
  const ignoreFumens = ignoreData ? new Set(ignoreData.split(/\n/).map(s => s.trim()).filter(Boolean).filter(s => !s.startsWith("#"))) : null;
  
  const startTime = Date.now();
  
  const patterns = csvToPatterns(data);
  const successPatterns = patterns.filter(p => p.solutionCount);
  // console.log(`${patterns.length} patterns, ${successPatterns.length} success`);
  
  if (ignoreFumens) {
    // console.log(`Ignore ${ignoreFumens.size} fumens`);
    for (const pattern of successPatterns) {
      pattern.fumens = pattern.fumens.filter(f => !ignoreFumens.has(f));
    }
  }
  
  const {edges, nodes} = patternsToGraph(successPatterns);
  // console.log(`${edges.length} edges, ${nodes.length} nodes`);
  
  const {count, sets} = findMinimalNodes(edges);
  // console.log(`Finished in ${(Date.now() - startTime) / 1000}s`);
  
  // console.log(`You must learn ${count} solutions to cover all patterns. There are ${sets.length} combinations of solutions to cover all patterns.`);
  
  const solutionMap = new Map();
  for (const pattern of patterns) {
    for (const fumen of pattern.fumens) {
      let sol = solutionMap.get(fumen);
      if (!sol) {
        sol = {
          fumen,
          patterns: []
        };
        solutionMap.set(fumen, sol);
      }
      sol.patterns.push(pattern.pattern);
    }
  }
  
  const set = await findBestSet(sets);
  
  const solutions = set.map(n => {
    const sol = solutionMap.get(n.key);
    const alters = n.alter.map(n => solutionMap.get(n.key));
    return {
      fumen: sol.fumen,
      patterns: sol.patterns,
      alters
    };
  });
  solutions.sort((a, b) => b.patterns.length - a.patterns.length);
  
  return({
    solutions: solutions,
    patternCount: patterns.length,
    successCount: successPatterns.length
  });
  // output({
  //   filename: "path_minimal_strict.md",
  //   solutions,
  //   patternCount: patterns.length,
  //   successCount: successPatterns.length
  // });
}

async function findBestSet(sets) {
  while (sets.length > 1) {
    // console.log(`Try to find the best set. There are ${sets.length} sets`);
    // find common nodes?
    const diffA = new Set;
    const diffB = new Set(sets[1]);
    for (const node of sets[0]) {
      if (diffB.has(node)) {
        diffB.delete(node);
      } else {
        diffA.add(node);
      }
    }
    
    const result = 0;
    // const result = await prompt({
    //   message: "Which is better?",
    //   fumens: [diffA, diffB].map(s => [...s].map(n => n.key))
    // });
    
    const dropNodes = result ? diffA : diffB;
    sets = sets.filter(s => s.every(n => !dropNodes.has(n)));
  }
  return sets[0];
}

async function output({filename, solutions, patternCount, successCount}) {
  await fs.writeFile(filename, `
${solutions.length} minimal solutions  
Success rate: ${(100 * successCount / patternCount).toFixed(2)}% (${successCount} / ${patternCount})

### Summary

${solutions.map(solutionToImage).join(" ")}

### Details

${solutions.map(s => solutionToMarkdown(s, successCount)).join("\n")}
`);
  console.log(`Write to ${filename}`);
}

function solutionToImage(sol) {
  const fumen = sol.alters.length ? fumenJoin([sol.fumen, ...sol.alters.map(a => a.fumen)]) : sol.fumen;
  return `[${fumenImage(fumen)}](${fumenLink(fumen)})`;
}

function fumenJoin(fumens) {
  return encoder.encode(fumens.map(decoder.decode).flat());
}

function solutionToMarkdown(sol, allPatternCount) {
  return `
${solutionToImage(sol)}

${sol.patterns.length} patterns (${(100 * sol.patterns.length / allPatternCount).toFixed(2)}%)

\`\`\`
${[...sol.patterns].join(",")}
\`\`\`
`;
}

function fumenImage(fumen) {
  return `![fumen image](https://fumen-svg-server--eight041.repl.co/?delay=1500&data=${encodeURIComponent(fumen)})`;
}

function fumenLink(fumen) {
  return `https://harddrop.com/fumen/?${fumen}`;
}

module.exports = {run}