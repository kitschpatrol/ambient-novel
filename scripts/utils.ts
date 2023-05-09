import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prettier from 'prettier';

// utility functions used by generateData.ts

export function checkForBinaryOnPath(binary: string) {
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

export function stripHtmlTags(input: string): string {
	const htmlRegex = /<\/?[^>]+(>|$)/g;
	return input.replace(htmlRegex, '');
}

export function kebabCase(input: string): string {
	const cleanedString = input.replace(/[^a-zA-Z0-9\s_.-]+/g, '');
	return cleanedString.trim().replace(/\s+/g, '-').toLowerCase();
}

export function padHeadAndTailOfAudio(
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

export function trimSilence(sourceFile: string, outputFile: string, secondsToKeep = 0.5): void {
	if (!fs.existsSync(sourceFile)) {
		throw new Error(`Source file does not exist: ${sourceFile}`);
	}

	const tempOutputFile = generateTempFilename(outputFile);
	// doing this in multiple steps to avoid re-encoding

	// measure durations
	const totalDuration = getAudioDuration(sourceFile);
	const silenceDurationStart = parseFloat(
		runCommand(
			`ffmpeg -vn -i "${sourceFile}" -af "silencedetect=noise=-50dB:d=0.25" -f null - 2>&1 | grep "silence_duration" | head -n 1  | awk '{print $NF}'`
		)
	);
	const silenceDurationEnd = parseFloat(
		runCommand(
			`ffmpeg -vn -i "${sourceFile}" -af "areverse,silencedetect=noise=-50dB:d=0.25" -f null - 2>&1 | grep "silence_duration" | head -n 1 | awk '{print $NF}'`
		)
	);

	// trim file, but leave a little extra
	const trimStartSeconds = Math.max(silenceDurationStart - secondsToKeep, 0);
	const trimEndSeconds = totalDuration - Math.max(silenceDurationEnd - secondsToKeep, 0);

	runCommand(
		`ffmpeg -vn -i "${sourceFile}" -ss ${trimStartSeconds} -to ${trimEndSeconds} -c copy "${tempOutputFile}"`
	);
	fs.renameSync(tempOutputFile, outputFile);
}

export function formatJson(jsonString: string): string {
	const prettierConfig = prettier.resolveConfig.sync(process.cwd());
	return prettier.format(jsonString, { ...prettierConfig, parser: 'json' });
}

export function sayToFile(textToSay: string, ouputFile: string) {
	runCommand(`say -o "${ouputFile}" "${textToSay}"`);
}

export function truncateWithEllipsis(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}

	const ellipsis = '...';
	const truncatedText = text.slice(0, maxLength - ellipsis.length);
	return truncatedText + ellipsis;
}

export function createIntermediatePaths(inputPath: string, clearExisting = false) {
	if (clearExisting && fs.existsSync(inputPath)) {
		fs.rmSync(inputPath, { recursive: true, force: true });
	}

	const isDirPath = !path.extname(inputPath);
	const targetPath = isDirPath ? inputPath : path.dirname(inputPath);
	fs.mkdirSync(targetPath, { recursive: true });
}

export function getAudioDuration(file: string): number {
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
export function compressTo(
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
