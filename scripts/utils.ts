import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prettier from 'prettier';
import leven from 'leven';
import { stripHtml } from 'string-strip-html';

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

// trim non-json garbage
export function extractOutermostJsonObjectArray(s: string): string {
	const start = s.indexOf('[{') >= 0 ? s.indexOf('[{') : 0;
	const end = s.lastIndexOf('}]') >= 0 ? s.lastIndexOf('}]') + 2 : s.length;
	return s.slice(start, end);
}

export function runCommand(command: string): string {
	try {
		const output = execSync(command, { stdio: 'pipe' });
		return output.toString();
	} catch (error) {
		throw new Error(`Error running command: ${command}\nMessage: ${error}`);
	}
}

export function saveFormattedJson(file: string, theObject: object) {
	fs.writeFileSync(file, formatJson(JSON.stringify(theObject)), {
		encoding: 'utf8'
	});
}

// export function stripHtmlTags(input: string): string {
// 	const htmlRegex = /<\/?[^>]+(>|$)/g;
// 	return input.replace(htmlRegex, '');
// }

export function stripHtmlTags(html: string): string {
	return stripHtml(html).result;
}

export function getTextBetween(
	source: string,
	firstDelimeter: string,
	lastDelimeter: string
): string {
	const firstIndex = source.indexOf(firstDelimeter) + firstDelimeter.length;
	const lastIndex = source.indexOf(lastDelimeter);
	return source.slice(firstIndex, lastIndex);
}

export function stripEmojis(text: string): string {
	const emojiRegex =
		/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji}\uFE0F|🗝|🦊|💜|🗝|🎱|🚀|力||||/gu;
	return text.replace(emojiRegex, '');
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
		`ffmpeg -y -vn -i "${sourceFile}" -af "adelay=delays=${paddingSeconds * 1000}|${
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
			`ffmpeg -y -vn -i "${sourceFile}" -af "silencedetect=noise=-50dB:d=0.25" -f null - 2>&1 | grep "silence_duration" | head -n 1  | awk '{print $NF}'`
		)
	);
	const silenceDurationEnd = parseFloat(
		runCommand(
			`ffmpeg -y -vn -i "${sourceFile}" -af "areverse,silencedetect=noise=-50dB:d=0.25" -f null - 2>&1 | grep "silence_duration" | head -n 1 | awk '{print $NF}'`
		)
	);

	// trim file, but leave a little extra
	const trimStartSeconds = Math.max(silenceDurationStart - secondsToKeep, 0);
	const trimEndSeconds = totalDuration - Math.max(silenceDurationEnd - secondsToKeep, 0);

	runCommand(
		`ffmpeg -y -vn -i "${sourceFile}" -ss ${trimStartSeconds} -to ${trimEndSeconds} -c copy "${tempOutputFile}"`
	);
	fs.renameSync(tempOutputFile, outputFile);
}

export function actionWordTrimmer(text: string): string {
	return text.replace(/([A-Za-z])\1{3,}/gu, '$1');
}

export function formatJson(jsonString: string): string {
	const prettierConfig = prettier.resolveConfig.sync(process.cwd());
	return prettier.format(jsonString, { ...prettierConfig, parser: 'json' });
}

export function sayToFile(textToSay: string, ouputFile: string) {
	runCommand(`say -o "${ouputFile}" --data-format=LEF32@44100 --channels=2 "${textToSay}"`);
}

export function sayToFileCoqui(textToSay: string, ouputFile: string) {
	// Excellent voices...
	// 287, 232

	// Good voices...
	// 262, 318, 317, 298

	runCommand(
		`conda run -n coqui tts --text "${textToSay}" --model_name tts_models/en/vctk/vits --speaker_idx p232 --out_path "${ouputFile}"`
	);
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
		`ffmpeg -y -vn -i "${sourceFile}" -c:a libfdk_aac -ar ${sampleRate} -vbr ${bitrateMode} "${tempOutputFile}"`
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
		`ffmpeg -y -vn -i "${sourceFile}" -codec:a libmp3lame -ar ${sampleRate} -qscale:a ${bitrateMode} "${tempOutputFile}"`
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

export function transcribe(sourceAudioFile: string, destinationJsonFile: string) {
	// writes to .json
	runCommand(
		`conda run -n whisperx whisperx "${sourceAudioFile}" --model tiny --device cpu --batch_size 16 --language en --compute_type int8  --output_format json --no_align`
	);

	const whisperXTempOutput = `${path.basename(
		sourceAudioFile,
		path.extname(sourceAudioFile)
	)}.json`;
	const transcriptRawJson = JSON.parse(fs.readFileSync(whisperXTempOutput, 'utf8'));
	fs.rmSync(whisperXTempOutput, { force: true });

	saveFormattedJson(destinationJsonFile, transcriptRawJson.segments);
}

export function normalizeWord(s: string): string {
	const regex = /[^A-Za-z0-9]/g;
	const filtered = s.toLowerCase().replace(regex, '');
	return filtered;
}

function getLevenSentenceDistance(sentenceA: string, sentenceB: string): number {
	return leven(sentenceA, sentenceB);
}

// speech to text turns e.g. 'five' into 5
// change it back to improve odds of a sentence match
function spellOutNumbers(text: string): string {
	text = text.replace(/\b0\b/gu, 'zero');
	text = text.replace(/\b1\b/gu, 'one');
	text = text.replace(/\b2\b/gu, 'two');
	text = text.replace(/\b3\b/gu, 'three');
	text = text.replace(/\b4\b/gu, 'four');
	text = text.replace(/\b5\b/gu, 'five');
	text = text.replace(/\b6\b/gu, 'six');
	text = text.replace(/\b7\b/gu, 'seven');
	text = text.replace(/\b8\b/gu, 'eight');
	text = text.replace(/\b9\b/gu, 'nine');
	return text;
}

export function alignTranscriptToAudioWithWordLevelTimings(
	perfectTranscriptString: string,
	sourceRawTranscriptFile: string,
	sourceAudioFile: string,
	destinationTimingsFile: string,
	destinationTranscriptMatchedFile?: string // just for reference
) {
	const transcriptRaw = JSON.parse(fs.readFileSync(sourceRawTranscriptFile, 'utf8'));

	// go through the raw transcript, try to replace the detected words with the perfect transcript from book.json
	const targetWordsArray = perfectTranscriptString.split(' ');

	for (const chunk of transcriptRaw) {
		const rawWords: string = chunk.text.trim();
		const rawWordsArray = rawWords
			.split(' ')
			.map((word) => spellOutNumbers(actionWordTrimmer(normalizeWord(word))));

		// find peak similarity
		let minSimilarity = Number.MAX_SAFE_INTEGER;
		let minSimilarityIndex = 0;

		for (
			let i = 0;
			i <= Math.min(Math.floor(rawWordsArray.length * 1.5), targetWordsArray.length);
			i++
		) {
			const similarity = getLevenSentenceDistance(
				rawWordsArray.join(' '),
				targetWordsArray
					.slice(0, i)
					.map((word) => spellOutNumbers(actionWordTrimmer(normalizeWord(word))))
					.join(' ')
			);

			if (similarity < minSimilarity) {
				// console.log(`Min similarity ${similarity} at window ${i}`);
				minSimilarity = similarity;
				minSimilarityIndex = i;
			}
		}

		// swap the raw words for the matched words in the raw transcript
		chunk.text = targetWordsArray.splice(0, minSimilarityIndex).join(' ');

		console.log(`Raw: ${rawWords}`);
		console.log(`Mat: ${chunk.text}\n\n`);
	}

	// add any straggler words to the last entry, TODO this is ugly
	if (targetWordsArray.length > 0) {
		console.warn(
			`There were ${targetWordsArray.length} left over words... adding them to the last chunk`
		);
		transcriptRaw[transcriptRaw.length - 1].text =
			transcriptRaw[transcriptRaw.length - 1].text + ' ' + targetWordsArray.join(' ');
	}

	if (destinationTranscriptMatchedFile) {
		saveFormattedJson(destinationTranscriptMatchedFile, transcriptRaw);
	}

	// Generate timings
	// Only works on a few lines of text, hence the fuss above

	let timings: object[] = [];

	for (const chunk of transcriptRaw) {
		// if (chunkNumber < transcriptRaw.length - 1) continue;

		// console.log(`chunk ${chunkNumber}: ${JSON.stringify(chunk, null, 2)}`);
		const timingsRawJson: string = runCommand(
			`conda run -n whisperx python ./scripts/whisperxAlign.py --audio_file="${sourceAudioFile}" --transcript="${chunk.text}" --start_time=${chunk.start} --end_time=${chunk.end}`
		);

		// console.log(`timingsRawJson: ${JSON.stringify(timingsRawJson, null, 2)}`);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const timingsRaw: any[] = JSON.parse(timingsRawJson);

		// console.log(`timingsRaw: ${JSON.stringify(timingsRaw, null, 2)}`);
		for (const segement of timingsRaw) {
			timings = [...timings, ...segement.words];
		}
	}

	saveFormattedJson(destinationTimingsFile, timings);
}
