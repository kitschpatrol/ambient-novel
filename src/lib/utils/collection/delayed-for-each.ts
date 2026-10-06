/**
 * Iterates over an array and calls a callback function for each item with a
 * delay between each call.
 */
export async function delayedForEach<T>(
	array: T[],
	callback: (item: T, index: number, array: T[]) => void,
	delay: number,
): Promise<void> {
	for (const [i, item] of array.entries()) {
		await new Promise((resolve) => {
			setTimeout(resolve, delay)
		})
		callback(item, i, array)
	}
}
