/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs';
import round from 'lodash/round';
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
	saveFormattedJson,
	sayToFileCoqui,
	stripEmojis,
	stripHtmlTags,
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
	bookAuditSettings: {
		lineLengthWarningThreshold: 1100, // characters
		lineLengthSingle: 98, // average full-width line, for calculating breaks
		abortOnLineLengthWarnings: false
	},
	jsonSettings: {
		sourceFile: './data/book.json',
		outputFile: './src/lib/data/book.json',
		includeWordTimingsArray: true, // puts, technically all this data is present if embedWordTimingsInHtml is true
		embedWordTimingsInHtml: true, // puts <spans> with timing data round words in the line's text
		generateStackText: true, // processes the text field to make it suitable for stack mode, embedWordTimingsInHtml and includeWordTimingsArray must be true!
		abortOnSchemaErrors: false // useful for outputting the resulting book.json with minor errors
	},
	speechSettings: {
		regenerateSource: false,
		regenerateCompressed: false,
		regenerateTranscript: false,
		regenerateWordAlignment: false,
		annunciateTitles: true, // true if scott reads the chapter name at the start of the track, or if we want the generated audio to include this
		generatedDataDir: './data-generated',
		sourceDir: '/Users/mika/Documents/Projects/Ambient Novel with Scott Wayne Indiana/Audio/Voice', // will generate using say if missing
		outputDir: null
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

// audit line length
let haveLineWarnings = false;
bookSource.chapters.forEach((chapter, chapterIndex) => {
	chapter.lines.forEach((line, lineIndex) => {
		const lineWithHtmlBreaks = line.split(/(?<=<br \/>)|(?<=<br>)|(?<=<li>)/giu);

		let lineCharCount = 0;
		lineWithHtmlBreaks.forEach((line) => {
			// consider it a full line if it contains html, since that's a break
			if (line.match(/(<br \/>)|<br>|<li>/giu)) {
				lineCharCount += config.bookAuditSettings.lineLengthSingle;
			} else {
				lineCharCount += stripHtmlTags(line).length;
			}
		});

		if (lineCharCount > config.bookAuditSettings.lineLengthWarningThreshold) {
			console.warn(
				`Warning: Chapter ${chapterIndex + 1} Line ${
					lineIndex + 1
				} that starts "${truncateWithEllipsis(
					stripHtmlTags(line),
					30
				)}" is ${lineCharCount} characters long`
			);
			haveLineWarnings = true;
		}
	});
});

// Continue generation...
if (haveLineWarnings && config.bookAuditSettings.abortOnLineLengthWarnings) {
	console.log('Aborting because some lines are too long...');
	process.exit(1);
} else if (!haveLineWarnings) {
	console.log('All lines are within the length threshold');
}

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

// generate speech and compress
for (const [chapterNumber, chapterSource] of bookSource.chapters.entries()) {
	console.log(
		`Processing chapter ${chapterNumber}: ${truncateWithEllipsis(chapterSource.title, 30)}`
	);

	const chapter: StripArray<typeof bookOutput.chapters> = {};
	chapter.title = chapterSource.title;
	chapter.index = chapterNumber;
	chapter.lineShuffleAllowed = chapterSource.lineShuffleAllowed;
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

		// TODO pad with some silence?
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

	// add word timings to the output
	let wordTimings = JSON.parse(fs.readFileSync(wordTimingsFile, 'utf8'));

	// special handling to ignore chapter annunciation in word timings transcript
	if (config.speechSettings.annunciateTitles) {
		const chapterAnnunciationWordCount = stripEmojis(stripHtmlTags(chapterAnnunciationText))
			.trim()
			.split(' ').length;

		wordTimings = wordTimings.slice(chapterAnnunciationWordCount);
	}

	for (const [lineNumber, lineSource] of chapterSource.lines.entries()) {
		// console.log(
		// 	`Processing chapter ${chapterNumber} line ${lineNumber}: ${truncateWithEllipsis(
		// 		lineSource,
		// 		30
		// 	)}`
		// );

		const wordsSource = stripEmojis(stripHtmlTags(lineSource)).trim().split(' ');

		const line: StripArray<DeepPartial<BookData['chapters'][0]['lines'][0]>> = {};
		line.text = lineSource;
		line.index = lineNumber;
		line.wordTimings = [];

		wordsSource.forEach((wordSource) => {
			const wordTiming = wordTimings.shift();

			if (normalizeWord(wordSource) !== normalizeWord(wordTiming.word)) {
				throw new Error(`mismatched words "${wordSource}" vs. "${wordTiming.word}"`);
			}

			if (line.wordTimings) {
				line.wordTimings.push({
					word: wordTiming.word,
					start: wordTiming.start,
					end: wordTiming.end
				});
			}
		});

		chapter.lines.push(line);
	}

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

		chapter.audio.files!.push(audioFile.replace('./static/', ''));
	}

	// Figure out the per-line timing based on word timing
	// we could calculate this in app, but nice to have it AOT
	for (const [lineNumber, line] of chapter.lines.entries()) {
		const previousLine = lineNumber > 0 ? chapter.lines[lineNumber - 1] : null;
		const previousLineEndTime = previousLine?.wordTimings?.at(previousLine?.wordTimings.length - 1)
			?.end;

		const nextLine = lineNumber < chapter.lines.length - 1 ? chapter.lines[lineNumber + 1] : null;
		const nextLineStartTime = nextLine?.wordTimings?.at(0)?.start;

		const currentLineStartTime = line.wordTimings?.at(0)?.start;
		const currentLineEndTime = line.wordTimings?.at(line.wordTimings?.length - 1)?.end;

		if (!currentLineStartTime || !currentLineEndTime) {
			throw new Error('No current line start time...');
		}

		line.timing = {
			// start time is the average of last line's end time and this line's start time
			start: round(previousLineEndTime ? (previousLineEndTime + currentLineStartTime) / 2 : 0, 3),
			// end time is average of current line end time and next line start time, or the duration of the VO
			end: round(
				nextLineStartTime
					? (currentLineEndTime + nextLineStartTime) / 2
					: chapter.audio.durationSeconds,
				3
			)
		};
	}

	bookOutput.chapters?.push(chapter);
}

// Embed timings in line html
if (config.jsonSettings.embedWordTimingsInHtml) {
	console.log('Embedding word timings in HTML');

	bookOutput.chapters?.forEach((chapter) => {
		chapter.lines?.forEach((line) => {
			if (line.wordTimings === undefined) {
				throw new Error('Must have word timings array to perform html embedding');
			}

			if (line.text === undefined) {
				throw new Error('Must have a line of text to perform html embedding');
			}

			let text = line.text;
			let cursor = 0;

			for (const wordTiming of line.wordTimings) {
				const regex = generateRegexForString(wordTiming.word);
				const match = regexMatchInRange(text, regex, cursor);

				if (match === null) {
					throw new Error('no match');
				}

				const cursorStart = text.indexOf(match, cursor);
				const cursorEnd = cursorStart + match.length;

				let replacement = `<span data-time=${wordTiming.start}>${match}</span>`;

				// merge any existing span attributes
				replacement = replacement
					.replace(/<span(.+?)><span(.+?)>/g, '<span $1$2>')
					.replace(/<\/span>(.+)<\/span>/g, '$1</span>');

				text = replaceSubstring(text, replacement, cursorStart, cursorEnd);
				cursor = cursorStart + replacement.length;
			}

			// special case for list items, where we need the bullet to fade in as well
			// so we give any li elements the data-time from their closest span
			// include the </li> in the split

			const listParts = text.split(/(?<=<\/li>)/giu);

			text = listParts
				.map((listPart) => {
					// get the first time value after the list
					const matches = listPart.match(/data-time=([0-9.]+)/iu);
					if (matches) {
						return listPart.replace('<li>', `<li ${matches[0]}>`);
					} else {
						return listPart;
					}
				})
				.join('');

			line.text = text;
		});
	});
}

// Strip breaks
if (config.jsonSettings.generateStackText) {
	console.log('Generating stack text');
	bookOutput.chapters?.forEach((chapter) => {
		chapter.lines?.forEach((line) => {
			if (line.text === undefined) {
				throw new Error('Must have a line of text to generate stack text');
			}

			// strip breaks
			let textStack = line.text.replace(/(<br \/>)+/giu, ' ');

			// strip time data
			textStack = textStack.replace(/\s*data-time=[0-9.]+/g, '');

			// Strip style on non-span elements, e.g. <strong style=\"display: block; text-align: center;\">
			textStack = textStack.replace(/(<strong)( style=.+?")/giu, '$1');

			// Add bullets to text, since timing is handled differently for now...
			textStack = textStack.replace(/(<li><span.*?>)/g, '$1• ');

			line.textStack = textStack;
		});
	});
}

if (config.jsonSettings.includeWordTimingsArray) {
	console.log('Including word timings array in book.json');
} else {
	bookOutput.chapters?.forEach((chapter) => {
		chapter.lines?.forEach((line) => {
			delete line.wordTimings;
		});
	});
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
