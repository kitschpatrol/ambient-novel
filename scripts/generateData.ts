/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs';
import { parse } from 'node-html-parser';
import path from 'path';
import { bookSchema, type BookData } from '../src/lib/schemas/bookSchema';
import { bookSourceSchema } from './bookSourceSchema';
import {
	actionWordTrimmer,
	alignTranscriptToAudioWithWordLevelTimings,
	checkForBinaryOnPath,
	compressTo,
	createIntermediatePaths,
	findHashedFile,
	generateRegexForString,
	getAudioDuration,
	kebabCase,
	normalizeUnicode,
	normalizeWord,
	regexMatchInRange,
	renameFileWithHash,
	replaceSubstring,
	replaceTextNodeHtml,
	saveFormattedJson,
	sayToFileCoqui,
	stripEmojis,
	stripHtmlTags,
	stripTagNodeHtml,
	stripUnspeakables,
	transcribe,
	truncateWithEllipsis
} from './utils';

// Prerequisites ----------------------------------------------------------------------
//
// See readme for dependency installation instructions
//
// Mac only (because of `say` command, though `coqui` is typically used)
// You must have ffmpeg (with the fdk-aac codec) and ffprobe on your path.
// The bundled mac build of ffmpeg does not include fdk-aac, and the ffmpeg
// libraries available on npm do not include fdk-aac.
//
// We bother because AAC files generated with the aac codec bundled
// with normal ffmpeg are not supported in Safari.
//

// Customize this to your liking
const config = {
	jsonSettings: {
		sourceFile: './data/book.json',
		outputFile: './src/lib/data/book.json',
		abortOnSchemaErrors: false // useful for outputting the resulting book.json with minor errors
	},
	speechSettings: {
		regenerateSource: false, // runs TTS on the script
		regenerateCompressed: false,
		regenerateTranscript: false,
		regenerateWordAlignment: false,
		annunciateTitles: true, // true if scott reads the chapter name at the start of the track, or if we want the generated audio to include this
		generatedDataDir: './data-generated',
		sourceDir: '/Users/mika/Documents/Projects/Ambient Novel with Scott Wayne Indiana/Audio/Voice', // will generate using say if missing
		outputDir: null // where generated TTS ends up
	},
	audioMixSettings: {
		regenerateCompressed: false,
		sourceDir: '/Users/mika/Documents/Projects/Ambient Novel with Scott Wayne Indiana/Audio/Mix',
		outputDir: './static/audio',
		outputs: [
			{
				format: 'm4a', // aac
				quality: 0,
				sampleRate: 22050,
				vbr: false
			},
			{
				format: 'mp3',
				quality: 0,
				sampleRate: 22050,
				vbr: false
			}
		]
	}
};

console.log('Generating data...');

// Load the text
const bookSource = bookSourceSchema.parse(
	JSON.parse(fs.readFileSync(config.jsonSettings.sourceFile, 'utf8'))
);

// partial because we figure out the chapters later
// makes everything optional
type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends Array<infer U>
		? Array<DeepPartial<U>>
		: T[P] extends object
		? DeepPartial<T[P]>
		: T[P];
};

type StripArray<T> = T extends Array<infer U> ? U : T;

const bookOutput: DeepPartial<BookData> = {
	title: bookSource.title,
	titleAlt: bookSource.titleAlt,
	author: bookSource.author,
	year: bookSource.year,
	publisher: bookSource.publisher,
	country: bookSource.country,
	license: bookSource.license,
	chapters: []
};

checkForBinaryOnPath('ffmpeg');
checkForBinaryOnPath('ffprobe');
checkForBinaryOnPath('conda');

// generate ouput dirs if needed, clear them if regenerate is true
if (config.speechSettings.regenerateSource) {
	createIntermediatePaths(config.speechSettings.sourceDir, true);
}
createIntermediatePaths(config.jsonSettings.outputFile, true);

if (config.speechSettings.outputDir) {
	createIntermediatePaths(
		config.speechSettings.outputDir,
		config.speechSettings.regenerateCompressed
	);
}

createIntermediatePaths(
	config.audioMixSettings.outputDir,
	config.audioMixSettings.regenerateCompressed
);

// generate each chapter
for (const [chapterNumber, chapterSource] of bookSource.chapters.entries()) {
	console.log(
		`Processing chapter ${chapterNumber}: ${truncateWithEllipsis(chapterSource.title, 30)}`
	);

	const chapter: StripArray<typeof bookOutput.chapters> = {};
	chapter.title = chapterSource.title;
	chapter.index = chapterNumber;
	chapter.lines = [];
	chapter.audio = {};
	chapter.audio.files = [];

	// the period is important for timing inference in both tts and transcription
	const chapterAnnunciationText = `Chapter ${chapterNumber + 1}, ${chapterSource.title}. `;

	// glue together lines

	// say if needed
	const voiceOverSourceFile = `${config.speechSettings.sourceDir}/${chapterSource.audioVoiceSolo}`;
	console.log(`voiceOverSourceFile: ${JSON.stringify(voiceOverSourceFile, null, 2)}`);
	if (fs.existsSync(voiceOverSourceFile) && !config.speechSettings.regenerateSource) {
		console.log(
			`Already found voice over source file ${voiceOverSourceFile}, nothing to generate...`
		);
	} else {
		console.log('Generating say file...');

		// mac say implementation
		// insert special [[slnc ####]] (ms) directives to get silence between lines
		// longer pauses at the start
		// longer pauses between lines
		// shorter pauses between line breaks
		// const chapterTextClean =
		// 	'[[slnc 1500]]' +
		// 	chapterSource.lines
		// 		.reduce(
		// 			(prev, curr) =>
		// 				prev +
		// 				stripEmojis(stripHtmlTags(curr.replace('<br />', '[[slnc 500]]'))) +
		// 				'[[slnc 1200]]',
		// 			''
		// 		)
		// 		.trim()
		// 		// chapter 5 has ridiculous long strings of characters, on which the say command chokes
		// 		// this replaces and character strings with more than 3 of the same chars with a single char
		// 		.replace(/–/gu, '')
		// 		.replace(/([A-Za-z])\1{3,}/gu, '$1');

		// console.log(chapterTextClean);
		//sayToFile(chapterTextClean, voiceOverSourceFile);

		// doesn't seem to be a way to command pauses in coqui
		let chapterTextClean = [
			config.speechSettings.annunciateTitles ? chapterAnnunciationText : '',
			...chapterSource.lines
		]
			.reduce((prev, curr) => prev + stripEmojis(stripHtmlTags(curr.replace('<br />', ' '))), '')
			.trim()
			// chapter 5 has ridiculous long strings of characters, on which the say command chokes
			// this replaces and character strings with more than 3 of the same chars with a single char
			.replace(/–/gu, '');

		chapterTextClean = actionWordTrimmer(stripUnspeakables(normalizeUnicode(chapterTextClean)));

		sayToFileCoqui(chapterTextClean, voiceOverSourceFile);
	}

	//---------------

	// to get the per-word perfect transcript, we need the rough timings of the (error prone) whisperx transcript.
	// we later use these timings to force alignment of the perfect transcript against the audio
	// theoretically we could feed the whole perfect transcript to the audio and skip this step,
	// but whisperx can not handle alignment tasks of that size
	const transcriptRawFile = `${config.speechSettings.generatedDataDir}/chapter-${chapterNumber}-audio-transcript-raw.json`;
	if (fs.existsSync(transcriptRawFile) && !config.speechSettings.regenerateTranscript) {
		console.log('Already found audio transcript file, nothing to generate...');
	} else {
		console.log(`Transcribing ${voiceOverSourceFile} with whisperx...`);
		transcribe(voiceOverSourceFile, transcriptRawFile);
	}

	// align the perfect transcript to the audio, using timing chunks from the whisperx transcript
	const wordTimingsFile = `${config.speechSettings.generatedDataDir}/chapter-${chapterNumber}-word-timings.json`;
	if (fs.existsSync(wordTimingsFile) && !config.speechSettings.regenerateWordAlignment) {
		console.log(
			`Already found word-level timings file for ${chapterNumber}, nothing to generate...`
		);
	} else {
		console.log(`Getting word level timings with whisperx...`);

		const transcriptMatchedFile = `${config.speechSettings.generatedDataDir}/chapter-${chapterNumber}-audio-transcript-matched.json`;

		// append chapter annunciation text, which is not in book.js
		const chapterText = [
			config.speechSettings.annunciateTitles ? chapterAnnunciationText : '',
			...chapterSource.lines
		]
			.reduce((prev, curr) => prev + stripEmojis(stripHtmlTags(curr)) + ' ', '')
			.trim();

		alignTranscriptToAudioWithWordLevelTimings(
			chapterText,
			transcriptRawFile,
			voiceOverSourceFile,
			wordTimingsFile,
			transcriptMatchedFile
		);
	}

	// -------------------

	let wordTimings = JSON.parse(fs.readFileSync(wordTimingsFile, 'utf8'));

	// special handling to ignore chapter annunciation in word timings transcript
	if (config.speechSettings.annunciateTitles) {
		const chapterAnnunciationWordCount = stripEmojis(stripHtmlTags(chapterAnnunciationText))
			.trim()
			.split(' ').length;

		wordTimings = wordTimings.slice(chapterAnnunciationWordCount);
	}

	// overall chapter narration timing
	chapter.narrationTime = {
		start: wordTimings[0].start,
		end: wordTimings.at(-1).end
	};

	// generate lines
	for (const [lineNumber, lineSource] of chapterSource.lines.entries()) {
		// console.log(
		// 	`Processing chapter ${chapterNumber} line ${lineNumber}: ${truncateWithEllipsis(
		// 		lineSource,
		// 		30
		// 	)}`
		// );

		const wordsSource = stripEmojis(stripHtmlTags(lineSource)).trim().split(' ');

		let line = lineSource;
		let cursor = 0;

		wordsSource.forEach((wordSource, wordIndex) => {
			// find the matching timing word
			const wordTiming = wordTimings.shift();

			if (normalizeWord(wordSource) !== normalizeWord(wordTiming.word)) {
				throw new Error(`mismatched words "${wordSource}" vs. "${wordTiming.word}"`);
			}

			// add timing data spans to the right word in the line source
			const regex = generateRegexForString(wordTiming.word);
			const match = regexMatchInRange(line, regex, cursor);

			if (match === null) {
				throw new Error('no match');
			}

			const cursorStart = line.indexOf(match, cursor);
			const cursorEnd = cursorStart + match.length;

			// handle words that are already in spans
			let wordHtml = parse(match);

			if (!wordHtml.querySelector('span')) {
				wordHtml = parse(`<span>${match}</span>`);
			}

			// Add timing data
			wordHtml.querySelector('span')!.setAttribute('data-time', wordTiming.start);

			// add a class to set horizontal spacing between lines via css
			// but don't do it on the first line of the chapter
			if (lineNumber > 0 && wordIndex === 0) {
				wordHtml.querySelector('span')!.classList.add('line');
			}

			const renderedWordHtml = wordHtml.outerHTML;

			if (renderedWordHtml === undefined) {
				throw new Error('Word html is undefined');
			}

			line = replaceSubstring(line, renderedWordHtml, cursorStart, cursorEnd);
			cursor = cursorStart + renderedWordHtml.length;
		});

		const lineHtml = parse(line);

		// strip breaks and replace with a space
		stripTagNodeHtml(lineHtml, 'br', ' ');

		// Add bullets via css instead of li elements
		lineHtml.querySelectorAll('li').forEach((li) => {
			li.querySelector('span')!.classList.add('list');
		});

		// strip lists, can't see the discs anyway with inline css
		// order matters
		stripTagNodeHtml(lineHtml, 'li');
		stripTagNodeHtml(lineHtml, 'ul');

		// Sanitize less than '<' and greater than '>' characters which confuse svelte
		replaceTextNodeHtml(lineHtml, /</gi, '&lt;');
		replaceTextNodeHtml(lineHtml, />/gi, '&gt;');

		const renderedLineHtml = lineHtml.outerHTML;

		if (renderedLineHtml === undefined) {
			throw new Error('Word html is undefined');
		}

		chapter.lines.push(renderedLineHtml);
	}

	// -------------------------

	// mixed audio
	console.log(`Processing chapter ${chapterNumber} ambient track ${chapterSource.audioMix}`);

	const cleanFilename = kebabCase(path.parse(path.basename(chapterSource.audioMix)).name);
	const sourceFile = `${config.audioMixSettings.sourceDir}/${chapterSource.audioMix}`;
	chapter.audio.durationSeconds = getAudioDuration(sourceFile);

	for (const { format, quality, sampleRate, vbr } of config.audioMixSettings.outputs) {
		const audioFileUnhashed = `${config.audioMixSettings.outputDir}/${cleanFilename}.${format}`;
		let audioFile = findHashedFile(audioFileUnhashed);

		if (audioFile && !config.audioMixSettings.regenerateCompressed) {
			console.log(`Already found audio track ${audioFile}, nothing to generate...`);
		} else {
			// clean up existing
			if (audioFile) {
				fs.rmSync(audioFile, { force: true });
			}

			console.log(`Compressing audio file ${sourceFile} to ${format}`);
			compressTo(sourceFile, audioFileUnhashed, quality, sampleRate, vbr);

			// hash it
			audioFile = renameFileWithHash(audioFileUnhashed);
		}

		chapter.audio.files!.push(audioFile.replace(/\.?\/?static\//, ''));
	}

	bookOutput.chapters!.push(chapter);
}

// Check for errors

try {
	bookSchema.parse(bookOutput);
} catch (error) {
	console.log(`Error: ${error}`);
	config.jsonSettings.abortOnSchemaErrors && process.exit(1);
}

// rewrite the json file with speech file names and duration
saveFormattedJson(config.jsonSettings.outputFile, bookOutput);

console.log('...Done');
