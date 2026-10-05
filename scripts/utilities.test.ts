import { parse } from 'node-html-parser'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
	findHashedFile,
	generateRegexForString,
	renameFileWithHash,
	replaceTextNodeHtml,
	stripEmojis,
	stripHtmlTags,
	stripTagNodeHtml,
} from './utilities'

const hashedChapterPath = /\/chapter\.one\.[\da-f]{8}\.m4a$/

function strip(html: string, tagName: string, replacementText?: string): string {
	const root = parse(html)
	stripTagNodeHtml(root, tagName, replacementText)
	return root.outerHTML
}

describe('stripTagNodeHtml', () => {
	it('unwraps an element and keeps its children in place', () => {
		expect(strip('<p>a <em>b <b>c</b></em> d</p>', 'em')).toBe('<p>a b <b>c</b> d</p>')
	})

	it('unwraps every matching element', () => {
		expect(strip('<p><span class="a">one</span> <span class="b">two</span></p>', 'span')).toBe(
			'<p>one two</p>',
		)
	})

	it('unwraps nested elements with the same tag', () => {
		expect(strip('<p><em><em>deep</em></em></p>', 'em')).toBe('<p>deep</p>')
	})

	it('replaces matching elements with the replacement text', () => {
		expect(strip('<p>x<br />y<br />z</p>', 'br', ' ')).toBe('<p>x y z</p>')
	})

	it('flattens a list the way the data generator does', () => {
		const root = parse('<ul><li>Yoga </li><li>Wander </li></ul>')
		stripTagNodeHtml(root, 'li')
		stripTagNodeHtml(root, 'ul')
		expect(root.outerHTML).toBe('Yoga Wander ')
	})

	it('leaves html without matching elements unchanged', () => {
		expect(strip('<p>keep</p>', 'em')).toBe('<p>keep</p>')
	})
})

describe('replaceTextNodeHtml', () => {
	it('replaces text in nested text nodes but not in markup', () => {
		const root = parse('<p>3 > 2 <span title="x">and 4 > 3</span></p>')
		replaceTextNodeHtml(root, />/g, '&gt;')
		expect(root.outerHTML).toBe('<p>3 &gt; 2 <span title="x">and 4 &gt; 3</span></p>')
	})

	it('inserts the replacement literally', () => {
		const root = parse('<p>a b</p>')
		replaceTextNodeHtml(root, /b/g, '$&$&')
		expect(root.outerHTML).toBe('<p>a $&$&</p>')
	})
})

describe('generateRegexForString', () => {
	const sunflower = generateRegexForString('sunflower.')

	it('matches the plain word', () => {
		expect(sunflower.exec('a sunflower. end')?.[0]).toBe('sunflower.')
	})

	it('matches the word when it is split by span tags', () => {
		const html = '<span data-time="1">sun</span>flower.</span>'
		expect(sunflower.exec(html)?.[0]).toBe(html)
	})

	it('does not match a different word', () => {
		expect(sunflower.exec('sunflowers')).toBeNull()
	})

	it('escapes regex syntax in the word', () => {
		const regex = generateRegexForString('a.b')
		expect(regex.exec('axb')).toBeNull()
		expect(regex.exec('a.b')?.[0]).toBe('a.b')
	})

	// Relies on matching surrogate pairs as two code units, which the u and v flags would change
	it('includes an emoji that follows a character', () => {
		expect(generateRegexForString('hi').exec('hi🦊 there')?.[0]).toBe('hi🦊')
	})
})

describe('stripEmojis', () => {
	it('removes emoji', () => {
		expect(stripEmojis('Hi 🦊 there 💜!')).toBe('Hi  there !')
	})

	it('removes emoji written with a variation selector', () => {
		expect(stripEmojis('love ❤️ you')).toBe('love  you')
	})

	it('removes glyphs that the PDF scraper substitutes for emoji', () => {
		// Escaped so editors can't normalize them to other code points
		expect(stripEmojis('Coco\uF98A Chaplin\uF49C Buster\uF5DD')).toBe('Coco Chaplin Buster')
	})

	it('keeps digits and symbols that are only emoji with a variation selector', () => {
		expect(stripEmojis('Room 101 #1 *')).toBe('Room 101 #1 *')
	})

	it('handles an empty string', () => {
		expect(stripEmojis('')).toBe('')
	})
})

describe('stripHtmlTags', () => {
	it('removes inline tags', () => {
		expect(stripHtmlTags('of normal <span style="color: #000000;">black</span>.')).toBe(
			'of normal black.',
		)
	})

	it('turns line breaks into spaces', () => {
		expect(stripHtmlTags('map:<br /><br /><strong>Options & Opportunities</strong>')).toBe(
			'map: Options & Opportunities',
		)
	})

	it('decodes entities', () => {
		expect(stripHtmlTags('Tom &amp; Jerry &lt;3')).toBe('Tom & Jerry <3')
	})
})

describe('renameFileWithHash and findHashedFile', () => {
	let directory: string

	beforeEach(() => {
		// Glob patterns need forward slashes, including on Windows
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'utilities-test-')).replaceAll('\\', '/')
	})

	afterEach(() => {
		fs.rmSync(directory, { force: true, recursive: true })
	})

	it('inserts a content hash before the extension and finds the renamed file', () => {
		const file = `${directory}/chapter.one.m4a`
		fs.writeFileSync(file, 'audio')

		const hashed = renameFileWithHash(file)

		expect(hashed).toMatch(hashedChapterPath)
		expect(fs.existsSync(file)).toBe(false)
		expect(path.resolve(findHashedFile(file) ?? '')).toBe(path.resolve(hashed))
	})

	it('derives the hash from the file contents', () => {
		fs.writeFileSync(`${directory}/a.mp3`, 'same')
		fs.writeFileSync(`${directory}/b.mp3`, 'same')
		fs.writeFileSync(`${directory}/c.mp3`, 'different')

		const [a, b, c] = ['a.mp3', 'b.mp3', 'c.mp3'].map((file) =>
			renameFileWithHash(`${directory}/${file}`).split('.').at(-2),
		)

		expect(a).toBe(b)
		expect(c).not.toBe(a)
	})

	it('returns null when there is no hashed file', () => {
		expect(findHashedFile(`${directory}/missing.m4a`)).toBeNull()
	})

	it('throws when more than one hashed file matches', () => {
		fs.writeFileSync(`${directory}/track.11111111.m4a`, '')
		fs.writeFileSync(`${directory}/track.22222222.m4a`, '')

		expect(() => findHashedFile(`${directory}/track.m4a`)).toThrow('More than one hashed version')
	})
})
