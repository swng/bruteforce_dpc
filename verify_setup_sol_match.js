const { decoder, encoder, Field } = require('tetris-fumen');

var assert = require('assert');

async function verify(setup_fumen, solution_fumen) {
    let setup_field = decoder.decode(setup_fumen)[0].field;
    setup_field.clearLine();
    let setup_field_data = setup_field.field.field.pieces;

    let sol_field = decoder.decode(solution_fumen)[0].field;
    let sol_field_data = sol_field.field.field.pieces;


    for (j = 0; j < 100; j++) {
        let a = setup_field_data[j];
        let b = sol_field_data[j];
        assert((a !== 0 && b === 8) || (a === 0 && b !== 8), j);
    }
}

module.exports = {verify}
