const fs = require("fs").promises;
const { decoder, encoder } = require('tetris-fumen');

function countpieces(inputStr) {
    let count = 0;

    if (inputStr.includes("^")) {
        const excludedPieces = Array.from("IOSZJLT").filter((p) => !inputStr.slice(inputStr.indexOf("^")).includes(p));
        inputStr = inputStr.filter((char) => !excludedPieces.includes(char));
    }

    for (let char of inputStr) {
        if ("IOSZJLT".includes(char)) {
            count += 1;
        }
    }

    return count;
}

function combineLists(lists) {
    if (!lists || lists.length === 0) {
        return [];
    }

    const result = [];

    function combine(index, current) {
        if (index === lists.length) {
            result.push(current.join(""));
            return;
        }

        for (let i = 0; i < lists[index].length; i++) {
            combine(index + 1, current.concat(lists[index][i]));
        }
    }

    combine(0, []);
    return result;
}

function queuesplit(inputString) {
    // ngl I don't fully know what this function does, but it processes queue notation in some way
    let bagmode = false;
    let result = [];
    let temp = "";

    for (let char of inputString) {
        char = "ioszjlt".includes(char.toLowerCase()) ? char.toUpperCase() : char;

        if (!bagmode && "IOSZJLT".includes(char)) {
            result.push(char);
        }

        if (char === "[" || char === "*") {
            temp = "";
            bagmode = true;
        }

        if (bagmode) {
            temp += char;
        }

        if (char === "!" || "0123456789".includes(char)) {
            result.push(temp);
            bagmode = false;
        }
    }

    const resultString = result.join(",");
    return resultString;
}

function generatePermutations(bag, permutationLength) {
    let elements = Array.from(bag);

    if (elements.length > 0 && elements[0] === "^") {
        // Negate the list of elements
        elements = Array.from("IOSZJLT").filter((p) => !elements.slice(1).includes(p));
    } else {
        elements = elements[0] === "[" && elements[elements.length - 1] === "]" ? elements.slice(1, -1) : elements;
    }

    let permutations = [[]];
    let result = new Set();

    // Generate all permutations of the given length
    for (let i = 0; i < permutationLength; i++) {
        permutations = permutations.flatMap((p) => elements.filter((e) => !p.includes(e)).map((e) => p.concat(e)));
    }

    // Convert each permutation back to a string and add to the result set
    permutations.forEach((p) => result.add(p.join("")));

    // Convert the result set to a list and return it
    return Array.from(result);
}

function sfinderAllPermutations(inputStr) {
    const inputStrProcessed = queuesplit(inputStr);
    const inputs = inputStrProcessed.split(",");

    // Generate all permutations for each input
    const permutations = inputs.map((input) => {
        input = input.replace("^", "[^]").replace("!", "p" + countpieces(input));
        if (!input.includes("p")) {
            input += "p1";
        }

        const [bagWithBrackets, permutationLength] = input.split("p");
        const length = permutationLength || 1;

        const bag = bagWithBrackets.replace("*", "[IOSZJLT]").replace("[", "").replace("]", "").toUpperCase();

        return generatePermutations(bag, parseInt(length, 10));
    });

    return combineLists(permutations);
}

function hold_reorders(queue) {
    if (queue.length <= 1) return new Set(queue); // base case

    let result = new Set();

    let a = hold_reorders(queue.substring(1)); // use first piece, work on the 2nd-rest
    for (let part of a.values()) {
        result.add(queue[0] + part);
    }
    let b = hold_reorders(queue[0] + queue.substring(2)); // use second piece, work on 1st + 3rd-rest
    for (let part of b.values()) {
        result.add(queue[1] + part);
    }
    return result;
}

async function write_nohold_queues(sfinder_notation_queues, nohold_queues_txt) {
    let nohold_queues = new Set();

    let starting_queues = sfinderAllPermutations(sfinder_notation_queues);

    for (queue of starting_queues) {
        let hold_reorderings = hold_reorders(queue);
        nohold_queues = new Set([...nohold_queues, ...hold_reorderings]);
    }

    let content = Array.from(nohold_queues).join("\n");

    await fs.writeFile(nohold_queues_txt, content);
}

function parse_results(results, patternCount, successCount) {
    let pages = []
    for (result of results) {
        let fumen = result.fumen;
        let page = decoder.decode(fumen)[0];
        page.comment = `${(result.patterns.length/patternCount * 100).toFixed(2)}% (${result.patterns.length}/${patternCount})`
        pages.push(page);
    }
    return encoder.encode(pages);
}

async function deleteFiles(filePaths) {
    try {
      for (const filePath of filePaths) {
        await fs.unlink(filePath);
        // console.log(`File ${filePath} deleted successfully`);
      }
    } catch (err) {
    //   console.error('Error deleting file:', err);
    }
  }



module.exports = { write_nohold_queues, parse_results, deleteFiles };

// write_nohold_queues("T,*p7", "input/nohold_queues.txt")
