import seedrandom from 'seedrandom'

/**
 * Deterministically shuffle an array using a seed.
 */
export function seededShuffle<T>(array: T[], seed: string): T[] {
	// RNG must return [0, 1)
	const seededRng = seedrandom(seed)
	let currentIndex = array.length

	// While there remain elements to shuffle...
	while (currentIndex !== 0) {
		// Pick a remaining element...
		const randomIndex = Math.floor(seededRng() * currentIndex)
		currentIndex -= 1

		// And swap it with the current element.
		// Both indexes are in bounds, so the values are T even if T includes undefined
		const temporaryValue = array[currentIndex] as T
		array[currentIndex] = array[randomIndex] as T
		array[randomIndex] = temporaryValue
	}

	return array
}
