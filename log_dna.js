#!node
/* std libs */
const fs = require('fs');
/* installed libs */
const axios = require('axios');
const CLI_ARGS = require('minimist')(process.argv.slice(2));

function usage(error) {
	console.log(
		'flags\n' +
		'	optional -s, -start_date  => start date for export, defaults to 1 day ago\n' +
		'	optional -e, -end_date    => end   date for export, defaults to now\n' +
		'	optional -d, -delta       => delta time to get from start date to end date (ms), defaults to 1 day\n' +
		'	optional -q, -query       => logDNA compliant search query, defaults to \'\'\n' +
		'	required -k, -service_key => API key for making request to logDNA\n\n' +
		'output\n' +
		'	files will be written to disk as follows: start_date.jsonl, (start_date+delta.jsonl), ... end_date.jsonl\n' +
		'	(dates will be js timestamps, i.e. ms since epoch 0)\n'
	);
	if (error) {
		console.log('ERROR: Missing required arguments!');
		process.existCode = 1;
		process.exit();
	}
	process.exit();
}

if (CLI_ARGS.h || CLI_ARGS.help) usage(false);

const SERVICE_KEY = CLI_ARGS.k || CLI_ARGS.service_key;
if (!SERVICE_KEY) usage(true);

let START_DATE = null;
if (CLI_ARGS.s) START_DATE = Date.parse(CLI_ARGS.s);
if (CLI_ARGS.start_date) START_DATE = Date.parse(CLI_ARGS.start_date);
if (START_DATE === null) START_DATE = Date.now() - (1000 * 60 * 60 * 24);

let END_DATE = null;
if (CLI_ARGS.e) END_DATE = Date.parse(CLI_ARGS.e);
if (CLI_ARGS.end_date) END_DATE = DATE.parse(CLI_ARGS.end_date);
if (END_DATE === null) END_DATE = Date.now();

let TIME_STEP = null;
if (CLI_ARGS.d) TIME_STEP = parseInt(CLI_ARGS.d);
if (CLI_ARGS.delta) TIME_STEP = parseInt(CLI_ARGS.delta);
if (TIME_STEP === null) TIME_STEP = 1000 * 60 * 60 * 24; // one day in ms

let QUERY = '';
if (CLI_ARGS.q) QUERY = CLI_ARGS.q;
if (CLI_ARGS.query) QUERY = CLI_ARGS.query;

const DIR_NAME = `logdna_export_for_${START_DATE}_to_${END_DATE}_ts${Date.now()}`;
if (!fs.existsSync(DIR_NAME)) fs.mkdirSync(DIR_NAME);

async function main() {
	let from_time = START_DATE;
	let to_time   = START_DATE + TIME_STEP;
	if (to_time > END_DATE) to_time = END_DATE;
	let is_first_pass = true;
	while (to_time < END_DATE || is_first_pass) {
		is_first_pass = false;
		let url = `https://api.logdna.com/v1/export?from=${from_time}&to=${to_time}`;
		if (QUERY && QUERY.length > 0) url += `&query=${QUERY}`;
		try {
			let res = await axios(
				{
					method: 'get',
					url: url,
					auth: {
						username: SERVICE_KEY,
					},
				}
			);
			fs.writeFileSync(`${DIR_NAME}/${from_time}_to_${to_time}.jsonl`, res.data);
			from_time += TIME_STEP;
			to_time   += TIME_STEP;
		} catch (err) {
			console.log('err!: ', err);
		}
	}
}

main().then(() => console.log('Finished Export...'));
