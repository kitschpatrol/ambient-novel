import fs from 'fs';
import path from 'path';
import { bookSourceSchema } from './bookSourceSchema';
import { type Book, bookSchema } from '../src/lib/schemas/bookSchema';
import {
	checkForBinaryOnPath,
	compressTo,
	createIntermediatePaths,
	getAudioDuration,
	kebabCase,
	saveFormattedJson,
	sayToFile,
	stripHtmlTags,
	stripEmojis,
	normalizeWord,
	truncateWithEllipsis,
	transcribe,
	alignTranscriptToAudioWithWordLevelTimings
} from './utils';

// Prerequisites ----------------------------------------------------------------------

// Mac only (because of "say" command)
// You must have ffmpeg (with the fdk-aac codec) and ffprobe on your path.
// The bundled mac build of ffmpeg does not include fdk-aac, and the ffmpeg
// libraries available on npm do not include fdk-aac.
//
// We bother because AAC files generated with the aac codec bundled
// with normal ffmpeg are not supported in Safari.
//
// Recommended installation procedure:
// $ brew tap homebrew-ffmpeg/ffmpeg
// $ brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-fdk-aacbrew tap homebrew-ffmpeg/ffmpeg
// You must also have access to the lossless ambient audio files.
// These are too large to bundle in the repo

// this duration is applied to both the head and tail
// so total additional duration is this times 2

// Customize this to your liking
const config = {
	jsonSettings: {
		sourceFile: './data/book.json',
		outputFile: './src/lib/data/book.json'
	},
	speechSettings: {
		regenerateSource: false,
		regenerate: false,
		generatedDataDir: './data-generated',
		sourceDir: '/Users/mika/Documents/Projects/Ambient Novel with Scott Wayne Indiana/Voice Over', // will generate using say if missing
		outputDir: './static/speech',
		outputs: [
			{
				format: 'mp3',
				quality: 0,
				sampleRate: 22050
			},
			{
				format: 'm4a', // aac
				quality: 0,
				sampleRate: 22050
			}
		]
	},
	musicSettings: {
		regenerate: false,
		sourceDir: '/Users/mika/Documents/Projects/Ambient Novel with Scott Wayne Indiana/Soundtrack',
		outputDir: './static/music',
		outputs: [
			{
				format: 'mp3',
				quality: 0,
				sampleRate: 22050
			},
			{
				format: 'm4a', // aac
				quality: 0,
				sampleRate: 22050
			}
		]
	}
};

console.log('Generating data...');

checkForBinaryOnPath('ffmpeg');
checkForBinaryOnPath('ffprobe');
checkForBinaryOnPath('conda');

// generate ouput dirs if needed, clear them if regenerate is true
if (config.speechSettings.regenerateSource) {
	createIntermediatePaths(config.speechSettings.sourceDir, true);
}
createIntermediatePaths(config.jsonSettings.outputFile, true);
createIntermediatePaths(config.speechSettings.outputDir, config.speechSettings.regenerate);
createIntermediatePaths(config.musicSettings.outputDir, config.musicSettings.regenerate);

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

const bookOutput: DeepPartial<Book> = {
	title: bookSource.title,
	titleAlt: bookSource.titleAlt,
	author: bookSource.author,
	year: bookSource.year,
	publisher: bookSource.publisher,
	country: bookSource.country,
	chapters: []
};

// generate speech and compress
for (const [chapterNumber, chapterSource] of bookSource.chapters.entries()) {
	console.log(
		`Processing chapter ${chapterNumber}: ${truncateWithEllipsis(chapterSource.title, 30)}`
	);

	const chapter: StripArray<typeof bookOutput.chapters> = {};
	chapter.title = chapterSource.title;
	chapter.lineShuffleAllowed = chapterSource.lineShuffleAllowed;
	chapter.lines = [];
	chapter.voiceOver = {};
	chapter.voiceOver.files = [];

	// glue together lines
	const chapterText = chapterSource.lines
		.reduce((prev, curr) => prev + stripEmojis(stripHtmlTags(curr)) + ' ', '')
		.trim();

	// say if needed
	const voiceOverSourceFile = `${config.speechSettings.sourceDir}/${chapterSource.voiceOver}`;
	if (fs.existsSync(voiceOverSourceFile) && !config.speechSettings.regenerateSource) {
		console.log(
			`Already found voice over source file ${voiceOverSourceFile}, nothing to generate...`
		);
	} else {
		console.log('Generating say file...');
		sayToFile(chapterText, voiceOverSourceFile);
	}

	chapter.voiceOver.durationSeconds = getAudioDuration(voiceOverSourceFile);
	chapter.voiceOver.originalFile = voiceOverSourceFile;

	// compress the audio if needed
	for (const { format, quality, sampleRate } of config.speechSettings.outputs) {
		const speechFile = `${config.speechSettings.outputDir}/${chapterNumber}.${format}`;

		if (fs.existsSync(speechFile) && !config.speechSettings.regenerate) {
			console.log(`Already found voice over output file ${speechFile}, nothing to generate...`);
		} else {
			console.log(`Compressing ${voiceOverSourceFile} speech to ${format}`);
			compressTo(voiceOverSourceFile, speechFile, quality, sampleRate);
		}

		chapter.voiceOver.files.push(speechFile.replace('./static/', ''));
	}

	//---------------

	// to get the per-word perfect transcript, we need the rough timings of the (error prone) whisperx transcript.
	// we later use these timings to force alignment of the perfect transcript against the audio
	// theoretically we could feed the whole perfect transcript to the audio and skip this step,
	// but whisperx can not handle alignment tasks of that size
	const transcriptRawFile = `${config.speechSettings.generatedDataDir}/chapter-${chapterNumber}-audio-transcript.json`;
	if (fs.existsSync(transcriptRawFile) && !config.speechSettings.regenerate) {
		console.log('Already found audio transcript file, nothing to generate...');
	} else {
		console.log(`Transcribing ${voiceOverSourceFile} with whisperx...`);
		transcribe(voiceOverSourceFile, transcriptRawFile);
	}

	// align the perfect transcript to the audio, using timing chunks from the whisperx transcript
	const wordTimingsFile = `${config.speechSettings.generatedDataDir}/chapter-${chapterNumber}-word-timings.json`;
	if (fs.existsSync(wordTimingsFile) && !config.speechSettings.regenerate) {
		console.log('Already found word-level timings file, nothing to generate...');
	} else {
		console.log(`Getting word level timings with whisperx...`);

		alignTranscriptToAudioWithWordLevelTimings(
			chapterText,
			transcriptRawFile,
			voiceOverSourceFile,
			wordTimingsFile
		);
	}

	// -------------------

	// add word timings to the output
	const wordTimings = JSON.parse(fs.readFileSync(wordTimingsFile, 'utf8'));

	for (const [lineNumber, lineSource] of chapterSource.lines.entries()) {
		console.log(
			`Processing chapter ${chapterNumber} line ${lineNumber}: ${truncateWithEllipsis(
				lineSource,
				30
			)}`
		);

		const wordsSource = stripEmojis(stripHtmlTags(lineSource)).trim().split(' ');

		const line: StripArray<DeepPartial<Book['chapters'][0]['lines'][0]>> = {};
		line.text = lineSource;
		line.timings = [];

		wordsSource.forEach((wordSource) => {
			const wordTiming = wordTimings.shift();

			if (normalizeWord(wordSource) !== normalizeWord(wordTiming.word)) {
				throw new Error(`mismatched words ${wordSource} vs. ${wordTiming.word}`);
			}

			if (line.timings) {
				line.timings.push({
					word: wordTiming.word,
					start: wordTiming.start,
					end: wordTiming.end
				});
			}
		});

		chapter.lines.push(line);
	}

	// ambient tracks
	console.log(`Processing chapter ${chapterNumber} ambient tracks`);
	chapter.ambientTracks = [];

	for (const ambientTracksSource of chapterSource.ambientTracks) {
		console.log(`Processing chapter ${chapterNumber} ambient track ${ambientTracksSource}`);
		const ambientTrack: StripArray<DeepPartial<Book['chapters'][0]['ambientTracks']>> = {};
		ambientTrack.originalFile = ambientTracksSource;
		ambientTrack.files = [];

		const cleanFilename = kebabCase(path.parse(path.basename(ambientTracksSource)).name);

		const sourceFile = `${config.musicSettings.sourceDir}/${ambientTracksSource}`;
		ambientTrack.durationSeconds = getAudioDuration(sourceFile);

		// too wonky
		// const filePathLosslessTrimmed = generateTempFilename(filePathLossless);
		// trimSilence(filePathLossless, filePathLosslessTrimmed);
		// const secondsTrimmed =
		// 	getAudioDuration(filePathLossless) - getAudioDuration(filePathLosslessTrimmed);
		// console.log(`Trimmed ${secondsTrimmed} seconds of silence`);
		// compressToAac(filePathLosslessTrimmed, filePathCompressedAac, ambientMusicQuality);
		// compressToMp3(filePathLosslessTrimmed, filePathCompressedMp3, ambientMusicQuality);
		// fs.rmSync(filePathLosslessTrimmed, { force: true });

		for (const { format, quality, sampleRate } of config.musicSettings.outputs) {
			const outputFile = `${config.musicSettings.outputDir}/${cleanFilename}.${format}`;

			// generate only if needed, since there might be multiple references to
			// the same ambient track
			if (fs.existsSync(outputFile) && !config.musicSettings.regenerate) {
				console.log(`Already compressed ambient track ${outputFile}`);
			} else {
				console.log(`Compressing ambient ${sourceFile} to ${format}`);
				compressTo(sourceFile, outputFile, quality, sampleRate);
			}

			ambientTrack.files.push(outputFile.replace('./static/', ''));
		}

		chapter.ambientTracks?.push(ambientTrack);
	}

	bookOutput.chapters?.push(chapter);
}

// Check for errors
bookSchema.parse(bookOutput);
// console.log(`bookSchema: ${bookSchema}`);

saveFormattedJson(config.jsonSettings.outputFile, bookOutput);

// rewrite the json file with speech file names and duration
console.log('...Done');
