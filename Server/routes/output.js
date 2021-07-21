/*
    Team7 server js - output module | Update: 2021/07/14
*/

const fs = require('fs');
const xlsx = require('xlsx');
const csv = require('csv');
const iconv = require('iconv-lite');

// ----- xlsxファイル生成 -----
async function xlsx_gen(data, fname, callback) {
	var xutil = xlsx.utils;
	(async () => {
		let wb = xutil.book_new();
		let ws = xutil.aoa_to_sheet(data);
		let ws_name = fname;
		xutil.book_append_sheet(wb, ws, ws_name);
		xlsx.writeFile(wb, fname);
		console.log('created: ' + fname);
		callback();
		try {
			fs.unlinkSync(fname);
		} catch {
			console.log('Failed to delete '+fname);
		}
	})();
}

// ----- csvファイル生成 -----
async function csv_gen(data, fname, encode, callback) {
	// var data_conv = iconv.encode(data, encode);
	csv.stringify(data, (error, output) => {
		output = iconv.encode(output, encode);
		console.log(output);
		fs.writeFile(fname, output, (error) => {
			if (error) {
				console.log(error);
			} else {
				console.log('created: ' + fname);
				callback();
				try {
					fs.unlinkSync(fname);
				} catch {
					console.log('Failed to delete '+fname);
				}
			}
			return;
		})
	})
}

exports.xlsx_gen = xlsx_gen;
exports.csv_gen = csv_gen;
