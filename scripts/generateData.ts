import fs from 'fs';
import { bookSourceSchema } from './bookSourceSchema';
import { type Book, bookSchema } from '../src/lib/schemas/bookSchema';
import {
	checkForBinaryOnPath,
	compressTo,
	createIntermediatePaths,
	getAudioDuration,
	kebabCase,
	saveFormattedJson,
	padHeadAndTailOfAudio,
	sayToFile,
	stripHtmlTags,
	truncateWithEllipsis
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
		regenerate: true,
		headAndTailSilenceSeconds: 1,
		sourceDir: null, // generate using say if empty
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
		regenerate: true,
		headAndTailSilenceSeconds: 0,
		sourceDir: '/Users/mika/Downloads/Soundtrack',
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

// generate ouput dirs if needed, clear them if regenerate is true
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

	// lines
	chapter.lines = [];

	for (const [lineNumber, lineSource] of chapterSource.lines.entries()) {
		console.log(
			`Processing chapter ${chapterNumber} line ${lineNumber}: ${truncateWithEllipsis(
				lineSource.text,
				30
			)}`
		);

		const line: StripArray<DeepPartial<Book['chapters'][0]['lines']>> = {};
		line.text = lineSource.text;
		line.voiceOver = {};
		line.voiceOver.originalFile = lineSource.voiceOver;
		line.voiceOver.files = [];

		const fileBase = `${chapterNumber}-${lineNumber}`;

		for (const { format } of config.speechSettings.outputs) {
			line.voiceOver.files.push(
				`${config.speechSettings.outputDir}/${fileBase}.${format}`.replace('./static/', '')
			);
		}

		if (config.speechSettings.regenerate) {
			let sourceFilePath: null | string = null;
			const tempSourceFilePath = `${config.speechSettings.outputDir}/${fileBase}.flac`;

			if (config.speechSettings.sourceDir !== null) {
				sourceFilePath = `${config.speechSettings.sourceDir}/${lineSource.voiceOver}`;
			} else {
				// no real source file, so we generate it
				console.log(`Generating speech since sourceDir is null`);
				sayToFile(stripHtmlTags(lineSource.text), tempSourceFilePath);
				sourceFilePath = tempSourceFilePath;
			}

			padHeadAndTailOfAudio(
				sourceFilePath,
				tempSourceFilePath,
				config.speechSettings.headAndTailSilenceSeconds
			);

			for (const { format, quality, sampleRate } of config.speechSettings.outputs) {
				console.log(`Compressing line ${lineNumber} speech to ${format}`);
				compressTo(
					tempSourceFilePath,
					`${config.speechSettings.outputDir}/${fileBase}.${format}`,
					quality,
					sampleRate
				);
			}

			// clean up
			fs.rmSync(tempSourceFilePath, { force: true });
		}

		line.voiceOver.durationSeconds = getAudioDuration(
			`${config.speechSettings.outputDir}/${fileBase}.${config.speechSettings.outputs[0].format}`
		);

		chapter.lines?.push(line);
	}

	// ambient tracks
	console.log(`Processing chapter ${chapterNumber} ambient tracks`);
	chapter.ambientTracks = [];

	for (const ambientTracksSource of chapterSource.ambientTracks) {
		console.log(`Processing chapter ${chapterNumber} ambient track ${ambientTracksSource}`);
		const ambientTrack: StripArray<DeepPartial<Book['chapters'][0]['ambientTracks']>> = {};
		ambientTrack.originalFile = ambientTracksSource;
		ambientTrack.files = [];

		const cleanFilename = kebabCase(ambientTracksSource);

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
			const sourceFile = `${config.musicSettings.sourceDir}/${ambientTracksSource}`;
			const outputFile = `${config.musicSettings.outputDir}/${cleanFilename}.${format}`;

			// generate only if needed, since there might be multiple references to
			// the same ambient track
			if (config.musicSettings.regenerate && !fs.existsSync(outputFile)) {
				console.log(`Compressing ambient track to ${format}`);
				compressTo(sourceFile, outputFile, quality, sampleRate);
			}

			ambientTrack.files.push(outputFile.replace('./static/', ''));
		}

		ambientTrack.durationSeconds = getAudioDuration(
			`${config.musicSettings.outputDir}/${cleanFilename}.${config.speechSettings.outputs[0].format}`
		);

		chapter.ambientTracks?.push(ambientTrack);
	}

	bookOutput.chapters?.push(chapter);
}

// Check for errors
bookSchema.parse(bookOutput);

saveFormattedJson(config.jsonSettings.outputFile, bookOutput);

// rewrite the json file with speech file names and duration
console.log('...Done');
