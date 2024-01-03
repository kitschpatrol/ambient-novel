export async function delayedForEach<T>(
	array: T[],
	callback: (item: T, index: number, array: T[]) => void,
	delay: number,
): Promise<void> {
	for (let i = 0; i < array.length; i++) {
		// eslint-disable-next-line no-promise-executor-return
		await new Promise((resolve) => setTimeout(resolve, delay))
		callback(array[i], i, array)
	}
}
