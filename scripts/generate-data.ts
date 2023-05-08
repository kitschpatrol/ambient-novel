import fs from 'fs';
import { execSync } from 'child_process';
import prettier from 'prettier';

console.log('Generating data...');

// Prerequisites:
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
const speechHeadAndTailSilenceSeconds = 1;
const ambientMusicSourceDir = '/Users/mika/Downloads/Soundtrack';
const ambientMusicQuality = 0; // todo revisit
const speechQuality = 0; // todo revisit

// Generates a voice audio file for each line in the source text
// Converts to aac and mp3 and saves to speechDir
// AAC not working in safari???
const speechDir = `./static/speech`;
const musicDir = `./static/music`;
const jsonDir = `./src/lib/data-generated`;

function checkForBinaryOnPath(binary: string) {
	try {
		const binaryPath = execSync(`which ${binary}`).toString().trim();
		console.log(`${binary} is on the PATH at ${binaryPath}.`);
		return binaryPath;
	} catch (error) {
		throw new Error(`${binary} is not on the PATH. Please install it first.`);
	}
}

checkForBinaryOnPath('ffmpeg');
checkForBinaryOnPath('ffprobe');

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

async function formatJson(jsonString: string): Promise<string> {
	const prettierConfig = await prettier.resolveConfig(process.cwd());
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

clearAndCreate(speechDir);
clearAndCreate(jsonDir);
clearAndCreate(musicDir);

// Load the text
const textJson = JSON.parse(fs.readFileSync('./data/text.json', 'utf8'));

const outputJson: {
	title: string;
	ambientTracks: object[];
	lines: object[];
} = {
	title: textJson.title,
	ambientTracks: [],
	lines: []
};

// generate speech and compress
for (const [index, text] of textJson.lines.entries()) {
	// if (index > 0) continue;
	console.log(`Generating audio for line ${index}: ${truncateWithEllipsis(text, 48)}`);

	const filePathLossless = `${speechDir}/${index}.flac`;
	const filePathCompressedAac = `${speechDir}/${index}.m4a`;
	const filePathCompressedMp3 = `${speechDir}/${index}.mp3`;

	sayToFile(stripHtmlTags(text), filePathLossless);
	padHeadAndTailOfAudio(filePathLossless, filePathLossless, speechHeadAndTailSilenceSeconds);
	compressToAac(filePathLossless, filePathCompressedAac, speechQuality);
	compressToMp3(filePathLossless, filePathCompressedMp3, speechQuality);

	fs.rmSync(filePathLossless, { force: true });

	// update json
	outputJson.lines.push({
		text: text,
		speechFilePathMp3: filePathCompressedMp3.replace('./static/', ''),
		speechFilePathAac: filePathCompressedAac.replace('./static/', ''),
		speechDurationSeconds: getAudioDuration(filePathCompressedMp3)
	});
}

// generate ambient tracks
const ambientTracks = fs.readdirSync(ambientMusicSourceDir).filter((file) => file.endsWith('.wav'));
for (const [index, ambientFile] of ambientTracks.entries()) {
	// if (index > 0) continue;
	console.log(`Processing ambient track ${index} / ${ambientTracks.length}`);

	const cleanFileNameBase = kebabCase(ambientFile.replace('.wav', ''));
	const filePathLossless = `${ambientMusicSourceDir}/${ambientFile}`;
	const filePathCompressedAac = `${musicDir}/${cleanFileNameBase}.m4a`;
	const filePathCompressedMp3 = `${musicDir}/${cleanFileNameBase}.mp3`;

	// too wonky
	// const filePathLosslessTrimmed = generateTempFilename(filePathLossless);
	// trimSilence(filePathLossless, filePathLosslessTrimmed);
	// const secondsTrimmed =
	// 	getAudioDuration(filePathLossless) - getAudioDuration(filePathLosslessTrimmed);
	// console.log(`Trimmed ${secondsTrimmed} seconds of silence`);
	// compressToAac(filePathLosslessTrimmed, filePathCompressedAac, ambientMusicQuality);
	// compressToMp3(filePathLosslessTrimmed, filePathCompressedMp3, ambientMusicQuality);
	// fs.rmSync(filePathLosslessTrimmed, { force: true });

	compressToAac(filePathLossless, filePathCompressedAac, ambientMusicQuality);
	compressToMp3(filePathLossless, filePathCompressedMp3, ambientMusicQuality);

	// update json
	outputJson.ambientTracks.push({
		originalFileName: ambientFile,
		filePathMp3: filePathCompressedMp3.replace('./static/', ''),
		filePathAac: filePathCompressedAac.replace('./static/', ''),
		durationSeconds: getAudioDuration(filePathCompressedMp3)
	});
}

fs.writeFileSync(`${jsonDir}/text.json`, await formatJson(JSON.stringify(outputJson)), {
	encoding: 'utf8'
});

// rewrite the json file with speech file names and duration
console.log('...Done');
