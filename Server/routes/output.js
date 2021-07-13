/*
    Team7 server js - output module | Update: 2021/07/14
*/

const xlsx = require('xlsx');
const csv = require('csv');

// ----- xlsxファイル生成 -----
function xlsx_gen(data, fname) {
	var xutil = xlsx.utils;
	(async () => {
		let wb = xutil.book_new();
		let ws = xutil.aoa_to_sheet(data);
		let ws_name = fname;
		xutil.book_append_sheet(wb, ws, ws_name);
		xlsx.writeFile(wb, fname);
		console.log('created: ' + fname);
	})();
}

// ----- csvファイル生成 -----
function csv_gen(data, fname) {
	csv.stringify(data, (error, output) => {
		fs.writeFile(fname, output, (error) => {
			console.log('created: ' + fname);
		})
	})
}

exports.xlsx_gen = xlsx_gen;
exports.csv_gen = csv_gen;
