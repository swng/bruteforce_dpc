const fs = require('fs').promises;

async function grab_solutions(path_csv, solutions_txt) { // SOLUTION key
    let csv = await fs.readFile(path_csv, 'utf8');
	let rows = csv.trim().split("\n").slice(1).map(s => s.split(','));
    let content = "";
    for (let row of rows) {
        let solution_fumen = row[0];
        content += solution_fumen + "\n";
    }
    content = content.trim();
    await fs.writeFile(solutions_txt, content);
}

module.exports = {grab_solutions};