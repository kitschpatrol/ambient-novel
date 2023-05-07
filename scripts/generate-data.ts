import pathToFfmpeg from 'ffmpeg-static';
import fs from 'fs';
import { execSync } from 'child_process';
import ffprobeStatic from 'ffprobe-static';
import prettier from 'prettier';

console.log('Generating data...');

// this duration is applied to both the head and tail
// so total additional duration is this times 2
const speechHeadAndTailSilenceSeconds = 1;

// Generates a voice audio file for each line in the source text
// Converts to aac and mp3 and saves to speechDir
// AAC not working in safari???
const speechDir = `./static/speech`;
const musicDir = `./static/music`;
const jsonDir = `./src/lib/data-generated`;

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

function generateTempFilename(file: string): string {
	return file.replace(/(\.[^/.]+)$/, `_temp$1`);
}

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
			`${ffprobeStatic.path} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
		)
	);
}

// function compressToAac(sourceFile: string, outputFile: string, bitrate: number): void {
// 	if (!fs.existsSync(sourceFile)) {
// 		console.error('Source file does not exist');
// 		return;
// 	}

// 	const tempOutputFile = generateTempFilename(outputFile);
// 	runCommand(
// 		`${pathToFfmpeg} -i "${sourceFile}" -vn -c:a aac -b:a ${bitrate}k "${tempOutputFile}"`
// 	);
// 	fs.renameSync(tempOutputFile, outputFile);
// }

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

clearAndCreate(speechDir);
clearAndCreate(jsonDir);
clearAndCreate(musicDir);

// Load the text
const textJson = JSON.parse(fs.readFileSync('./data/text.json', 'utf8'));

const ambientMusicFileOutputPath = `${musicDir}/${textJson.ambientMusicFilePath}`;

const outputJson: {
	title: string;
	ambientMusicFilePath: string;
	lines: object[];
} = {
	title: textJson.title,
	ambientMusicFilePath: ambientMusicFileOutputPath.replace('./static/', ''),
	lines: []
};

// copy over placeholder ambient track, it's already compressed
fs.copyFileSync(`./data/${textJson.ambientMusicFilePath}`, ambientMusicFileOutputPath);

// generate speech and compress
for (const [index, text] of textJson.lines.entries()) {
	// if (index > 0) continue;
	console.log(`Generating audio for line ${index}: ${truncateWithEllipsis(text, 48)}`);

	const filePathLossless = `${speechDir}/${index}.flac`;
	// const filePathCompressedAac = `${speechDir}/${index}.m4a`;
	const filePathCompressedMp3 = `${speechDir}/${index}.mp3`;
	sayToFile(stripHtmlTags(text), filePathLossless);
	// compressToAac(filePathLossless, filePathCompressedAac, 32);
	padHeadAndTailOfAudio(filePathLossless, filePathLossless, speechHeadAndTailSilenceSeconds);
	compressToMp3(filePathLossless, filePathCompressedMp3, 32);
	fs.rmSync(filePathLossless, { force: true });

	// update json
	outputJson.lines.push({
		text: text,
		speechFilePath: filePathCompressedMp3.replace('./static/', ''),
		speechDurationSeconds: getAudioDuration(filePathCompressedMp3)
	});
}

fs.writeFileSync(`${jsonDir}/text.json`, await formatJson(JSON.stringify(outputJson)), {
	encoding: 'utf8'
});

// rewrite the json file with speech file names and duration
console.log('...Done');
