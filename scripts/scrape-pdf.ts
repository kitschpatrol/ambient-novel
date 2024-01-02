/* eslint-disable no-lonely-if */
import { getTextBetween, saveFormattedJson } from './utils'
import pdf from '@cyber2024/pdf-parse-fixed'
import fs from 'node:fs'

// Kind of a one-shot shortcut to getting the novel text
// too much work to really create consistent output without
// any hand-fixes

// gets pretty close, but there's no consistent way to quite get the line breaks
// right in the non-indented chapters, also not worth automating the color footnote
// to HTML conversion, or the bullet list to HTML conversion
// these changes are made by hand after generating the output file

// pdfreader and pdf2json both choke on emojis
// pdf-parse-fixed fails to load them correctly, but doesn't throw

// investigated using a proper parser like parsimmon, but just not worth it
// for the small scale and finickiness present here

// Helpers ----------------------------------------------------------------------

function getChapterText(source: string, chapterIndex: number, chapterDelimiters: string[]): string {
	return getTextBetween(
		source,
		chapterDelimiters[chapterIndex],
		chapterDelimiters[chapterIndex + 1] ?? source.length,
	)
}

function chapterTextToLines(
	text: string,
	emojiReplacements: string[][],
	breakOnIndentsOnly = false,
): string[] {
	let chapterText = text
	// Filter out footnote annotations (this way they don't get split into lines)
	chapterText = chapterText.replaceAll(/\n\d+\n/gu, '')

	let lines = chapterText.split(/\r?\n/gu)

	// Filter empty lines
	lines = lines.filter((line) => line.trim().length > 0)

	// Filter line numbers
	lines = lines.filter((line) => line.trim().replaceAll(/\d/g, '').length > 0)

	// Filter footnotes
	lines = lines.filter((line) => line.trim().match(/^\d+\s+#/g) === null)

	// For (const [i, line] of lines.entries()) {
	// 	console.log(`${i}|"${line}"`);
	// }

	// fix emoji, since the pdf parser can't read them correctly
	lines = lines.map((line) => {
		let lineWithEmoji = line
		for (const [pdfEmoji, scriptEmoji] of emojiReplacements) {
			lineWithEmoji = lineWithEmoji.replace(pdfEmoji, scriptEmoji)
		}

		return lineWithEmoji
	})

	// Stitch lines
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	lines = lines.reduce<string[]>((acc, line, index) => {
		// Console.log(`acc: ${acc}`);

		if (breakOnIndentsOnly) {
			if (/^\s+[A-Z]/.exec(line) === null) {
				acc[acc.length - 1] = acc.at(-1) + ' ' + line
			} else {
				acc.push(line)
			}
		} else {
			// Push the first line no matter what, but don't trim
			if (acc.length === 0 || /\s$/.exec(acc.at(-1)!) !== null) {
				acc.push(line)
			} else {
				acc[acc.length - 1] = acc.at(-1) + '<br />' + line
			}
		}

		return acc
	}, [])

	// Trim lines
	lines = lines.map((line) => line.trim())

	// Clean up double spaces
	lines = lines.map((line) => line.replaceAll(/\s+/gu, ' '))

	return lines
}

// Script an config ----------------------------------------------------------------------

// get text from the pdf
const { text } = await pdf(fs.readFileSync('./design/TVM.pdf'), {})

// Detect chapters using these ridiculous strings
const chapterDelimiters = [
	'\n\n\n\n1\n1\nThe Valentine Mob\n',
	'\n\n14\n\n15\n2\nMotel Van Been Hit',
	'\n\n23\n\n24\n\n25\n3\nMobile Tent Haven\n',
	'\n\n28\n\n29\n4\nNova Bent The Lime\n',
	'\n\n41\n5\nThe Ambient Novel\n',
	'\n\n57\n\n58\n\n59\n6\nHot Inane TV Beam\n',
	'\n\n60\n\n61\n7\nAbilene Moth Vent\n',
	'\n\n62\n\n63\n8\nThe Noble Vietnam \n',
	'\n\n64\n\n65\n9\nInvent Home Table\n',
	'\n\n66\n\n67\n10\nViable Tenth Omen\n',
]

// Some chapters are more poetic with many un-indented lines, others are more literary
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
	false,
]

// The pdf parser chokes on emoji, this recreates them after the fact
const emojiReplacements = [
	['力', '🦊'], // Coco
	['', '💜'], // Chaplin
	['', '🗝'], // Buster
	['', '🎱'], // Lucille, invisible!
	['', '🚀'], // Andy
]

// Prep for json output
const json: {
	chapters: Array<{ lines: string[]; title: string }>
} = {
	chapters: [],
}

// Parse each chapter into lines
for (let i = 0; i < chapterDelimiters.length; i++) {
	const chapterJson = {
		lines: [] as string[],
		title: chapterDelimiters[i].replaceAll(/\n|[^A-Za-z\s]/gu, ''),
	}

	const chapterText = getChapterText(text, i, chapterDelimiters)
	const chapterLines = chapterTextToLines(
		chapterText,
		emojiReplacements,
		chapterBreakOnIndentConfig[i],
	)

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	for (const [i, line] of chapterLines.entries()) {
		chapterJson.lines.push(line)
		// Console.log(`${i}|${line}`);
		// console.log(`${line}`);
	}

	json.chapters.push(chapterJson)
}

saveFormattedJson('./data-generated/book-pdf-scrape.json', json)
