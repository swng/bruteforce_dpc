const fs = require('fs');
const { decoder, encoder } = require('tetris-fumen');
const {unglue} = require('./unglueFumens.js');
const {make_sys_call} = require('./make_sys_call.js');
const {grab_solutions} = require('./read_path_csv.js');
const {write_nohold_queues, parse_results} = require('./utils.js');
const {wrapper_reduce_to_maximal_scoring_cover} = require('./scoremins.js');
const {cover_to_path} = require('./cover_to_path');
const {run} = require('./sfinder-strict-minimal/run.js');

async function main() {
    // let fumens = ["v115@vhHO6IzfBKpBUmB/tBFqB0sBRwB"];
    // unglued = unglue(fumens);

    let fumens = fs.readFileSync("./z_dpc_all_ordered.txt", 'utf8').split("\n");

    for (i = 0; i < fumens.length; i++) {
        let fumen = fumens[i];

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

        console.log(score_minimals_fumen);

    }
}

main();