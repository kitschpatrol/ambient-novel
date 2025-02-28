import seedrandom from 'seedrandom'

/**
 * Deterministically shuffle an array using a seed.
 */
export function seededShuffle<T>(array: T[], seed: string): T[] {
	// RNG must return [0, 1)
	const seededRng = seedrandom(seed)
	let currentIndex = array.length
	let temporaryValue: T
	let randomIndex: number

	// While there remain elements to shuffle...
	while (currentIndex !== 0) {
		// Pick a remaining element...
		randomIndex = Math.floor(seededRng() * currentIndex)
		currentIndex -= 1

		// And swap it with the current element.
		temporaryValue = array[currentIndex]
		array[currentIndex] = array[randomIndex]
		array[randomIndex] = temporaryValue
	}

	return array
}
