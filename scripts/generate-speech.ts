import pathToFfmpeg from 'ffmpeg-static';
import fs from 'fs';
import { execSync } from 'child_process';
import ffprobeStatic from 'ffprobe-static';
import prettier from 'prettier';

console.log('Generating data...');

// Generates a voice audio file for each line in the source text
// Converts to aac and mp3 and saves to speechDir
// AAC not working in safari???
const speechDir = `./static/speech`;
const musicDir = `./static/music`;
const jsonDir = `./src/lib/data-generated`;
const musicDurationPadding = 4; // add a head and tail to the music track

function runCommand(command: string): string {
	try {
		const output = execSync(command, { stdio: 'pipe' });
		return output.toString();
	} catch (error) {
		throw new Error(`Error running command: ${command}\nMessage: ${error}`);
	}
}

function generateTempFilename(file: string): string {
	return file.replace(/(\.[^/.]+)$/, `_temp$1`);
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
		`${pathToFfmpeg} -i "${sourceFile}" -af "adelay=delays=${paddingSeconds * 1000}|${
			paddingSeconds * 1000
		}:all=1,apad=pad_dur=${paddingSeconds}" "${tempOutputFile}"`
	);
	fs.renameSync(tempOutputFile, outputFile);
}

function fadeHeadAndTailOfAudio(
	sourceFile: string,
	outputFile: string,
	fadeDurationSeconds: number
): void {
	if (!fs.existsSync(sourceFile)) {
		throw new Error(`Source file does not exist: ${sourceFile}`);
	}

	const tempOutputFile = generateTempFilename(outputFile);
	runCommand(
		`${pathToFfmpeg} -i "${sourceFile}" -af "afade=t=in:ss=0:d=${fadeDurationSeconds},afade=t=out:st=${
			getAudioDuration(sourceFile) - fadeDurationSeconds
		}:d=${fadeDurationSeconds}" "${tempOutputFile}"`
	);
	fs.renameSync(tempOutputFile, outputFile);
}

async function formatJson(jsonString: string): Promise<string> {
	const prettierConfig = await prettier.resolveConfig(process.cwd());
	return prettier.format(jsonString, { ...prettierConfig, parser: 'json' });
}

function sayToFile(textToSay: string, ouputFile: string) {
	runCommand(`say -o "${ouputFile}" "${textToSay}"`);
}

function getRandomElement<T>(array: T[]): T {
	const randomIndex = Math.floor(Math.random() * array.length);
	return array[randomIndex];
}

function truncateWithEllipsis(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}

	const ellipsis = '...';
	const truncatedText = text.slice(0, maxLength - ellipsis.length);
	return truncatedText + ellipsis;
}

function clearAndCreate(path: string) {
	if (fs.existsSync(path)) {
		fs.rmSync(path, { recursive: true, force: true });
	}
	fs.mkdirSync(path);
}

function getAudioDuration(file: string): number {
	if (!fs.existsSync(file)) {
		throw new Error(`Source file does not exist: ${file}`);
	}

	return parseFloat(
		runCommand(
			`${ffprobeStatic.path} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
		)
	);
}

function compressToAac(sourceFile: string, outputFile: string, bitrate: number): void {
	if (!fs.existsSync(sourceFile)) {
		console.error('Source file does not exist');
		return;
	}

	const tempOutputFile = generateTempFilename(outputFile);
	runCommand(
		`${pathToFfmpeg} -i "${sourceFile}" -vn -c:a aac -b:a ${bitrate}k "${tempOutputFile}"`
	);
	fs.renameSync(tempOutputFile, outputFile);
}

function compressToMp3(sourceFile: string, outputFile: string, bitrate: number): void {
	if (!fs.existsSync(sourceFile)) {
		console.error('Source file does not exist');
		return;
	}

	const tempOutputFile = generateTempFilename(outputFile);
	runCommand(
		`${pathToFfmpeg} -i "${sourceFile}" -vn -c:a libmp3lame -b:a ${bitrate}k "${tempOutputFile}"`
	);
	fs.renameSync(tempOutputFile, outputFile);
}

function trimToRandomWindow(sourceFile: string, outputFile: string, targetDuration: number): void {
	if (!fs.existsSync(sourceFile)) {
		throw new Error(`Source file does not exist: ${sourceFile}`);
	}

	const sourceDuration = getAudioDuration(sourceFile);

	if (targetDuration >= sourceDuration) {
		throw new Error(
			`Target duration ${targetDuration} should be less than the source duration ${sourceDuration}`
		);
	}

	const randomStart = Math.random() * (sourceDuration - targetDuration);

	const tempOutputFile = generateTempFilename(outputFile);
	runCommand(
		`${pathToFfmpeg} -ss ${randomStart} -t ${targetDuration} -i "${sourceFile}" -vn -c:a flac "${tempOutputFile}"`
	);
	fs.renameSync(tempOutputFile, outputFile);
}

clearAndCreate(speechDir);
clearAndCreate(jsonDir);
clearAndCreate(musicDir);

// Load the text
const textJson = JSON.parse(fs.readFileSync('./data/text.json', 'utf8'));

for (const [index, { text }] of textJson.lines.entries()) {
	// if (index > 0) continue;
	console.log(`Generating audio for line ${index}: ${truncateWithEllipsis(text, 48)}`);

	// generate speech and compress
	const speechFilePathLossless = `${speechDir}/${index}.flac`;
	// const speechFilePathCompressedAac = `${speechDir}/${index}.m4a`;
	const speechFilePathCompressedMp3 = `${speechDir}/${index}.mp3`;
	sayToFile(text, speechFilePathLossless);
	padHeadAndTailOfAudio(speechFilePathLossless, speechFilePathLossless, musicDurationPadding / 2);
	// compressToAac(speechFilePathLossless, speechFilePathCompressedAac, 32);
	compressToMp3(speechFilePathLossless, speechFilePathCompressedMp3, 32);
	fs.rmSync(speechFilePathLossless, { force: true });

	// TEMP grab a random ambient track, trim it to the speech duration, fade the head and tail, compress to AAC

	const ambientFolder =
		'/Volumes/Working/Music/Library/Aphex Twin/Selected Ambient Works Volume II';
	const ambientTrack =
		ambientFolder +
		'/' +
		getRandomElement(fs.readdirSync(ambientFolder).filter((f) => f.endsWith('.mp3')));

	const musicFilePathLossless = `${musicDir}/${index}.flac`;
	// const musicFilePathCompressedAac = `${musicDir}/${index}.m4a`;
	const musicFilePathCompressedMp3 = `${musicDir}/${index}.mp3`;
	// match speech audio duration, note that speech has a silent header / tail
	const speechDuration = getAudioDuration(speechFilePathCompressedMp3);
	trimToRandomWindow(ambientTrack, musicFilePathLossless, speechDuration);
	fadeHeadAndTailOfAudio(musicFilePathLossless, musicFilePathLossless, 2);
	// compressToAac(musicFilePathLossless, musicFilePathCompressedAac, 32);
	compressToMp3(musicFilePathLossless, musicFilePathCompressedMp3, 32);
	fs.rmSync(musicFilePathLossless, { force: true });

	// update json
	textJson.lines[index].speechFilePath = speechFilePathCompressedMp3.replace('./static/', '');
	textJson.lines[index].speechDurationSeconds = speechDuration;
	textJson.lines[index].musicFilePath = musicFilePathCompressedMp3.replace('./static/', '');
	textJson.lines[index].musicDurationSeconds = speechDuration; // same for now
}

fs.writeFileSync(`${jsonDir}/text.json`, await formatJson(JSON.stringify(textJson)), {
	encoding: 'utf8'
});

// rewrite the json file with speech file names and duration
console.log('...Done');
