const fs = require('fs');
const {unglue} = require('./unglueFumens.js');

async function cover_to_path(input, output) {
    let csv = fs.readFileSync(input, 'utf8');
    let rows = csv.trim().split("\n").map(s => s.split(','));

    const ungluedRow = unglue(rows[0].slice(1));
    // console.log(ungluedRow);

    const outputCSV = [["pattern", "solutionCount", "solutions", "unusedMinos", "fumens"]];

    for (const row of rows.slice(1)) {
        const sequence = row[0];
        const successFumens = row.slice(1).reduce((acc, element, index) => {
        if (element === 'O') {
            acc.push(ungluedRow[index]);
        }
        return acc;
        }, []);

        outputCSV.push([sequence, successFumens.length, '', '', successFumens.join(';')]);
    }

    // console.log(`Writing to file: ${output}`);
    const writeStream = fs.createWriteStream(output, { flags: 'w', encoding: 'utf8' });

    writeStream.write(outputCSV.map(row => row.join(',')).join('\n'));
    writeStream.end();
}

module.exports = {cover_to_path}

// Example usage:
// cover_to_path('./new_cover.csv', './path.csv');