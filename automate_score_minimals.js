const fs = require('fs').promises;
const { decoder, encoder } = require('tetris-fumen');
const {unglue} = require('./unglueFumens.js');
const {glue} = require('./gluer.js');
const {make_sys_call} = require('./make_sys_call.js');
const {grab_solutions} = require('./read_path_csv.js');
const {write_nohold_queues, parse_results, deleteFiles} = require('./utils.js');
const {wrapper_reduce_to_maximal_scoring_cover} = require('./scoremins.js');
const {cover_to_path} = require('./cover_to_path');
const {run} = require('./sfinder-strict-minimal/run.js');
const {verify} = require('./verify_setup_sol_match.js')

async function score_minimals(fumen, name) {
        // console.log(fumen);

        const filesToDelete = [
            'input/nohold_queues.txt',
            'input/solutions_feed.txt',
            'output/cover.csv',
            'output/cover_nohold.csv',
            'output/last_output.txt',
            'output/path.csv',
            './path.csv',
            './new_cover.csv'
          ];
          
        await deleteFiles(filesToDelete);


        let queues = "*p7";

        let command = `java -jar sfinder.jar path -t "${fumen}" -p "${queues}" -K kicks/t.properties -d 180 --split yes --clear 6 --output output/path.csv -f csv -k solution`; // with path using SOLUTION key to make solutions easier to grab
        // console.log(command);
        await make_sys_call(command);

        await grab_solutions("output/path.csv", "input/solutions_feed.txt"); // SOLUTION key

        command = `java -jar sfinder.jar cover -fp input/solutions_feed.txt -K kicks/t.properties -d 180 -p "${queues}" -o output/cover.csv` // with hold
        // console.log(command);
        await make_sys_call(command);

        await write_nohold_queues(queues, "input/nohold_queues.txt");

        command = `java -jar sfinder.jar cover -fp "input/solutions_feed.txt" -K kicks/t.properties -d 180 -pp "input/nohold_queues.txt" --hold avoid -o "output/cover_nohold.csv"` // nohold
        // console.log(command);
        await make_sys_call(command);

        await wrapper_reduce_to_maximal_scoring_cover("output/cover.csv", "output/cover_nohold.csv", "new_cover.csv", true, 1, 0, 200, undefined);

        await cover_to_path('./new_cover.csv', './path.csv' );

        let results = await run('./path.csv');

        let score_minimals_fumen = parse_results(results.solutions, results.patternCount, results.successCount);

        verify(fumen, score_minimals_fumen);

        console.log(score_minimals_fumen);

        let solution_cover_string = glue((results.solutions).map(obj => obj.fumen)).join(" ");

        command = `java -jar sfinder.jar cover -t "${solution_cover_string}" -p "${queues}" -K kicks/t.properties -d 180 --output score_minimals/${name}.csv`; // with path 
        // console.log(command);
        await make_sys_call(command);

        command = `java -jar sfinder.jar cover -t "${solution_cover_string}" -pp "input/nohold_queues.txt" -K kicks/t.properties -d 180 --hold avoid --output score_minimals/${name}_nohold.csv`; // with path 
        // console.log(command);
        await make_sys_call(command);

}

async function main() {
    // let fumens = ["v115@vhHO6IzfBKpBUmB/tBFqB0sBRwB"];
    // unglued = unglue(fumens);

    // let fumens = fs.readFileSync("./z_dpc_all_ordered.txt", 'utf8').split("\n");

    let csv = await fs.readFile("Z.csv", 'utf8');
	let rows = csv.trim().split("\n").map(s => s.split(','));

    let fumens = unglue(rows[0].slice(1));
    let names = rows[1].slice(1);


    for (i = 0; i < fumens.length; i++) {
        let fumen = fumens[i];
        await score_minimals(fumen, names[i]);
        // console.log();
    }
}

main();