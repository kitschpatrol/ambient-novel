import pdf from '@cyber2024/pdf-parse-fixed';
import fs from 'fs';
import { getTextBetween, saveFormattedJson } from './utils';

// kind of a one-shot shortcut to getting the novel text
// too much work to really create consistent output without
// any hand-fixes

// gets pretty close, but there's no consistent way to quite get the line breaks
// right in the non-indented chapters, also not worth automating the color footnote
// to HTML conversion, or the bullet list to HTML conversion
// these changes are made by hand after generating the ouput file

// pdfreader and pdf2json both choke on emojis
// pdf-parse-fixed fails to load them correctly, but doesn't throw

// investigated using a proper parser like parsimmon, but just not worth it
// for the small scale and finickines present here

// Helpers ----------------------------------------------------------------------

function getChapterText(source: string, chapterIndex: number, chapterDelimeters: string[]): string {
	return getTextBetween(
		source,
		chapterDelimeters[chapterIndex],
		chapterDelimeters[chapterIndex + 1] ?? source.length
	);
}

function chapterTextToLines(
	text: string,
	emojiReplacements: string[][],
	breakOnIndentsOnly = false
): string[] {
	let chapterText = text;
	// filter out footnote annotations (this way they don't get split into lines)
	chapterText = chapterText.replace(/\n\d+\n/gu, '');

	let lines = chapterText.split(/\r?\n/gu);

	// filter empty lines
	lines = lines.filter((line) => {
		return line.trim().length > 0;
	});

	// filter line numbers
	lines = lines.filter((line) => {
		return line.trim().replace(/\d/g, '').length > 0;
	});

	// filter footnotes
	lines = lines.filter((line) => {
		return line.trim().match(/^\d+\s+#/g) === null;
	});

	// for (const [i, line] of lines.entries()) {
	// 	console.log(`${i}|"${line}"`);
	// }

	// fix emoji, since the pdf parser can't read them correctly
	lines = lines.map((line) => {
		let lineWithEmoji = line;
		for (const [pdfEmoji, scriptEmoji] of emojiReplacements) {
			lineWithEmoji = lineWithEmoji.replace(pdfEmoji, scriptEmoji);
		}
		return lineWithEmoji;
	});

	// stitch lines
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	lines = lines.reduce<string[]>((acc, line, index) => {
		// console.log(`acc: ${acc}`);

		if (breakOnIndentsOnly) {
			if (line.match(/^\s+[A-Z]/) !== null) {
				acc.push(line);
			} else {
				acc[acc.length - 1] = acc[acc.length - 1] + ' ' + line;
			}
		} else {
			// push the first line no matter what, but don't trim
			if (acc.length === 0 || acc[acc.length - 1].match(/\s$/) !== null) {
				acc.push(line);
			} else {
				acc[acc.length - 1] = acc[acc.length - 1] + '<br />' + line;
			}
		}
		return acc;
	}, []);

	// trim lines
	lines = lines.map((line) => {
		return line.trim();
	});

	// clean up double spaces
	lines = lines.map((line) => {
		return line.replace(/\s+/gu, ' ');
	});

	return lines;
}

// Script an config ----------------------------------------------------------------------

// get text from the pdf
const { text } = await pdf(fs.readFileSync('./design/TVM.pdf'), {});

// detect chapters using these ridiculous strings
const chapterDelimeters = [
	'\n\n\n\n1\n1\nThe Valentine Mob\n',
	'\n\n14\n\n15\n2\nMotel Van Been Hit',
	'\n\n23\n\n24\n\n25\n3\nMobile Tent Haven\n',
	'\n\n28\n\n29\n4\nNova Bent The Lime\n',
	'\n\n41\n5\nThe Ambient Novel\n',
	'\n\n57\n\n58\n\n59\n6\nHot Inane TV Beam\n',
	'\n\n60\n\n61\n7\nAbilene Moth Vent\n',
	'\n\n62\n\n63\n8\nThe Noble Vietnam \n',
	'\n\n64\n\n65\n9\nInvent Home Table\n',
	'\n\n66\n\n67\n10\nViable Tenth Omen\n'
];

// some chapters are more poetic with many un-indented lines, others are more literary
// with each line indented like a paragraph
// this config tries to pick the best line-splitting strategy for each chapter
const chapterBreakOnIndentConfig = [
	true,
	true,
	true,
	true,
	false,
	false,
	false,
	false,
	false,
	false
];

// the pdf parser chokes on emoji, this recreates them after the fact
const emojiReplacements = [
	['力', '🦊'], // coco
	['', '💜'], // chaplin
	['', '🗝'], // buster
	['', '🎱'], // lucille, invisible!
	['', '🚀'] // andy
];

// prep for json output
const json: {
	chapters: { title: string; lines: string[] }[];
} = {
	chapters: []
};

// parse each chapter into lines
for (let i = 0; i < chapterDelimeters.length; i++) {
	const chapterJson = {
		title: chapterDelimeters[i].replace(/\n|[^A-Za-z\s]/gu, ''),
		lines: <string[]>[]
	};

	const chapterText = getChapterText(text, i, chapterDelimeters);
	const chapterLines = chapterTextToLines(
		chapterText,
		emojiReplacements,
		chapterBreakOnIndentConfig[i]
	);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	for (const [i, line] of chapterLines.entries()) {
		chapterJson.lines.push(line);
		// console.log(`${i}|${line}`);
		// console.log(`${line}`);
	}

	json.chapters.push(chapterJson);
}

saveFormattedJson('./data-generated/book-pdf-scrape.json', json);
