import fs from 'fs';
import { bookSourceSchema } from './bookSourceSchema';
import {
	checkForBinaryOnPath,
	runCommand,
	sayToFile,
	stripHtmlTags,
	extractOutermostJsonObjectArray,
	saveFormattedJson,
	getAudioDuration
} from './utils';

import leven from 'leven';

// TS wrapper for talking to the whisperx alignment script from node
checkForBinaryOnPath('conda');

const audioSourceFile = './temp.flac';
// const audioSourceFile = './static/speech/0-0.mp3';

// load book data...
const bookSource = bookSourceSchema.parse(JSON.parse(fs.readFileSync('./data/book.json', 'utf8')));

// glue together lines
const chapterText = bookSource.chapters[0].lines
	.reduce((prev, curr) => prev + stripHtmlTags(curr.text) + ' ', '')
	.trim();

if (fs.existsSync(audioSourceFile)) {
	console.log('Already found audio file, nothing to generate...');
} else {
	console.log('Generating say file...');
	sayToFile(chapterText, audioSourceFile);
}

const transcriptSourceFile = './temp.json';
if (fs.existsSync(transcriptSourceFile)) {
	console.log('Already found transcript file, skipping transcription...');
} else {
	// Transcribe
	console.log('Transcribing with whisperx...');
	const transcriptRawJson: string = runCommand(
		`conda run -n whisperx python ./scripts/whisperxTranscribe.py --audio_file="${audioSourceFile}"`
	);

	saveFormattedJson(
		transcriptSourceFile,
		JSON.parse(extractOutermostJsonObjectArray(transcriptRawJson))
	);
}

//
const transcriptRaw = JSON.parse(fs.readFileSync(transcriptSourceFile, 'utf8'));

// console.log(`transcriptRaw: ${JSON.stringify(transcriptRaw, null, 2)}`);

// Jaccard similarity
function normalizeWord(s: string): string {
	const regex = /[^A-Za-z0-9]/g;
	const filtered = s.toLowerCase().replace(regex, '');
	return filtered;
}

function getDistance(sentenceA: string, sentenceB: string): number {
	return leven(sentenceA, sentenceB);
}

// go through the raw transcript, try to replace the detected words with the perfect transcript from book.json
const targetWordsArray = chapterText.split(' ');

for (const [chunkNumber, chunk] of transcriptRaw.entries()) {
	// if (chunkNumber > 1) break;
	const rawWords: string = chunk.text.trim();
	const rawWordsArray = rawWords.split(' ').map((word) => normalizeWord(word));

	// find peak similarity
	let minSimilarity = Number.MAX_SAFE_INTEGER;
	let minSimilarityIndex = 0;

	for (
		let i = 0;
		i <= Math.min(Math.floor(rawWordsArray.length * 1.5), targetWordsArray.length);
		i++
	) {
		const similarity = getDistance(
			rawWordsArray.join(' '),
			targetWordsArray
				.slice(0, i)
				.map((word) => normalizeWord(word))
				.join(' ')
		);

		if (similarity < minSimilarity) {
			// console.log(`Min similarity ${similarity} at window ${i}`);
			minSimilarity = similarity;
			minSimilarityIndex = i;
		}
	}

	// if the word is a perfect match, unshift it from the target words and append to matched words
	// swap the raw words for the matched words
	chunk.text = targetWordsArray.splice(0, minSimilarityIndex).join(' ');

	console.log(`Raw: ${rawWords}`);
	console.log(`Mat: ${chunk.text}\n\n`);
}

// // Generate timings
// // TODO works on a few lines but we're gonna need chunking for longer ones... hence the fuss above

let timings: object[] = [];

for (const [chunkNumber, chunk] of transcriptRaw.entries()) {
	// if (chunkNumber < transcriptRaw.length - 1) continue;

	console.log(`chunk ${chunkNumber}: ${JSON.stringify(chunk, null, 2)}`);
	const timingsRawJson: string = runCommand(
		`conda run -n whisperx python ./scripts/whisperxAlign.py --audio_file="${audioSourceFile}" --transcript="${chunk.text}" --start_time=${chunk.start} --end_time=${chunk.end}`
	);

	// console.log(`timingsRawJson: ${JSON.stringify(timingsRawJson, null, 2)}`);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const timingsRaw: any[] = JSON.parse(timingsRawJson);

	// console.log(`timingsRaw: ${JSON.stringify(timingsRaw, null, 2)}`);

	for (const segement of timingsRaw) {
		timings = [...timings, ...segement.words];
	}
}

saveFormattedJson('./timings.json', timings);

// // flatten the output
// const timings = {
// 	audioFile: audioSourceFile,
// 	words: []
// };

// for (const chunk of timingsRaw as { words: object[] }[]) {
// 	for (const word of chunk['words']) {
// 		console.log(`word: ${JSON.stringify(word, null, 2)}`);
// 		(timings.words as object[]).push(word);
// 	}
// }

// console.log(`timings: ${JSON.stringify(timings, null, 2)}`);
