import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prettier from 'prettier';
import * as z from 'zod';
import { type Book, bookSchema } from '../src/lib/schemas/bookSchema';

console.log('Generating data...');

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

// CONFIG ----------------------------------------------------------------------

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

// SCEHMAS ----------------------------------------------------------------------

const bookSourceSchema = z.object({
	title: z.string().nonempty(),
	titleAlt: z.string().nonempty(),
	author: z.string().nonempty(),
	year: z.number().int().positive(),
	publisher: z.string().nonempty(),
	country: z.string().nonempty(),
	chapters: z
		.array(
			z.object({
				title: z.string().nonempty(),
				ambientTracks: z.array(z.string().nonempty()),
				lineShuffleAllowed: z.boolean(),
				lines: z
					.array(
						z.object({
							text: z.string().nonempty(),
							voiceOver: z.string().nonempty()
						})
					)
					.nonempty()
			})
		)
		.nonempty()
});

// UTILS ----------------------------------------------------------------------

function checkForBinaryOnPath(binary: string) {
	try {
		const binaryPath = execSync(`which ${binary}`).toString().trim();
		console.log(`${binary} is on the PATH at ${binaryPath}.`);
		return binaryPath;
	} catch (error) {
		throw new Error(`${binary} is not on the PATH. Please install it first.`);
	}
}

function runCommand(command: string): string {
	try {
		const output = execSync(command, { stdio: 'pipe' });
		return output.toString();
	} catch (error) {
		throw new Error(`Error running command: ${command}\nMessage: ${error}`);
	}
}

function stripHtmlTags(input: string): string {
	const htmlRegex = /<\/?[^>]+(>|$)/g;
	return input.replace(htmlRegex, '');
}

function kebabCase(input: string): string {
	const cleanedString = input.replace(/[^a-zA-Z0-9\s_.-]+/g, '');
	return cleanedString.trim().replace(/\s+/g, '-').toLowerCase();
}

function padHeadAndTailOfAudio(
	sourceFile: string,
	outputFile: string,
	paddingSeconds: number
): void {
	if (!fs.existsSync(sourceFile)) {
		throw new Error(`Source file does not exist: ${sourceFile}`);
	}

	const tempOutputFile = generateTempFilename(outputFile);
	runCommand(
		`ffmpeg -vn -i "${sourceFile}" -af "adelay=delays=${paddingSeconds * 1000}|${
			paddingSeconds * 1000
		}:all=1,apad=pad_dur=${paddingSeconds}" "${tempOutputFile}"`
	);
	fs.renameSync(tempOutputFile, outputFile);
}

function generateTempFilename(file: string): string {
	return file.replace(/(\.[^/.]+)$/, `_temp$1`);
}

// function trimSilence(sourceFile: string, outputFile: string, secondsToKeep: number = 0.5): void {
// 	if (!fs.existsSync(sourceFile)) {
// 		throw new Error(`Source file does not exist: ${sourceFile}`);
// 	}

// 	const tempOutputFile = generateTempFilename(outputFile);
// 	// doing this in multiple steps to avoid re-encoding

// 	// measure durations
// 	const totalDuration = getAudioDuration(sourceFile);
// 	const silenceDurationStart = parseFloat(
// 		runCommand(
// 			`ffmpeg -vn -i "${sourceFile}" -af "silencedetect=noise=-50dB:d=0.25" -f null - 2>&1 | grep "silence_duration" | head -n 1  | awk '{print $NF}'`
// 		)
// 	);
// 	const silenceDurationEnd = parseFloat(
// 		runCommand(
// 			`ffmpeg -vn -i "${sourceFile}" -af "areverse,silencedetect=noise=-50dB:d=0.25" -f null - 2>&1 | grep "silence_duration" | head -n 1 | awk '{print $NF}'`
// 		)
// 	);

// 	// trim file, but leave a little extra
// 	const trimStartSeconds = Math.max(silenceDurationStart - secondsToKeep, 0);
// 	const trimEndSeconds = totalDuration - Math.max(silenceDurationEnd - secondsToKeep, 0);

// 	runCommand(
// 		`ffmpeg -vn -i "${sourceFile}" -ss ${trimStartSeconds} -to ${trimEndSeconds} -c copy "${tempOutputFile}"`
// 	);
// 	fs.renameSync(tempOutputFile, outputFile);
// }

function formatJson(jsonString: string): string {
	const prettierConfig = prettier.resolveConfig.sync(process.cwd());
	return prettier.format(jsonString, { ...prettierConfig, parser: 'json' });
}

function sayToFile(textToSay: string, ouputFile: string) {
	runCommand(`say -o "${ouputFile}" "${textToSay}"`);
}

function truncateWithEllipsis(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}

	const ellipsis = '...';
	const truncatedText = text.slice(0, maxLength - ellipsis.length);
	return truncatedText + ellipsis;
}

// function clearAndCreate(path: string) {
// 	if (fs.existsSync(path)) {
// 		fs.rmSync(path, { recursive: true, force: true });
// 	}
// 	fs.mkdirSync(path);
// }

function createIntermediatePaths(inputPath: string, clearExisting = false) {
	if (clearExisting && fs.existsSync(inputPath)) {
		fs.rmSync(inputPath, { recursive: true, force: true });
	}

	const isDirPath = !path.extname(inputPath);
	const targetPath = isDirPath ? inputPath : path.dirname(inputPath);
	fs.mkdirSync(targetPath, { recursive: true });
}

function getAudioDuration(file: string): number {
	if (!fs.existsSync(file)) {
		throw new Error(`Source file does not exist: ${file}`);
	}

	return parseFloat(
		runCommand(
			`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
		)
	);
}

// supports reversed output
function mapFloatToInt(input: number, minOut: number, maxOut: number): number {
	if (input < 0 || input > 1) {
		throw new Error('Input must be between 0 and 1.');
	}

	const range = Math.abs(maxOut - minOut) + 1;
	const mappedValue =
		minOut < maxOut ? minOut + Math.floor(input * range) : minOut - Math.floor(input * range);

	return Math.max(Math.min(mappedValue, Math.max(minOut, maxOut)), Math.min(minOut, maxOut));
}

// 0 is lowest quality, 1 is highest
function compressToAac(
	sourceFile: string,
	outputFile: string,
	quality: number,
	sampleRate = 22050
): void {
	if (!fs.existsSync(sourceFile)) {
		console.error('Source file does not exist');
		return;
	}

	// adapt to codec's quality scale (1 is lowest, 5 is highest)
	const bitrateMode = mapFloatToInt(quality, 1, 5);
	const tempOutputFile = generateTempFilename(outputFile);

	console.log(
		`Encoding ${sourceFile} to AAC with quality ${quality} (Codec-native: ${bitrateMode}) at ${sampleRate}kHz`
	);
	runCommand(
		`ffmpeg -vn -i "${sourceFile}" -c:a libfdk_aac -ar ${sampleRate} -vbr ${bitrateMode} "${tempOutputFile}"`
	);
	fs.renameSync(tempOutputFile, outputFile);
}

// 0 is lowest quality, 1 is highest
function compressToMp3(
	sourceFile: string,
	outputFile: string,
	quality: number,
	sampleRate = 22050
): void {
	if (!fs.existsSync(sourceFile)) {
		console.error('Source file does not exist');
		return;
	}

	// adapt to codec's quality scale (0 is highest, 9 is lowest)
	const bitrateMode = mapFloatToInt(quality, 9, 0);
	const tempOutputFile = generateTempFilename(outputFile);

	console.log(
		`Encoding ${sourceFile} to MP3 with quality ${quality} (Codec-native: ${bitrateMode}) at ${sampleRate}kHz`
	);
	runCommand(
		`ffmpeg -vn -i "${sourceFile}" -codec:a libmp3lame -ar ${sampleRate} -qscale:a ${bitrateMode} "${tempOutputFile}"`
	);
	fs.renameSync(tempOutputFile, outputFile);
}

// 0 is lowest quality, 1 is highest
// infers output type from extension
function compressTo(
	sourceFile: string,
	outputFile: string,
	quality: number,
	sampleRate = 22050
): void {
	const extension = outputFile.split('.').pop();

	switch (extension) {
		case 'm4a':
		case 'aac':
			compressToAac(sourceFile, outputFile, quality, sampleRate);
			break;
		case 'mp3':
			compressToMp3(sourceFile, outputFile, quality, sampleRate);
			break;
		default:
			throw new Error(`compressTo function hasn't implemented output file extension: ${extension}`);
	}
}

// CONTENT GENERATION ----------------------------------------------------------------------

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

fs.writeFileSync(config.jsonSettings.outputFile, formatJson(JSON.stringify(bookOutput)), {
	encoding: 'utf8'
});

// rewrite the json file with speech file names and duration
console.log('...Done');
