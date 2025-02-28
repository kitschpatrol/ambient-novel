/**
 * Returns an array of indices of the elements in the input array that match the test value.
 */
export function getIndicesMatchingValue<T>(array: T[], testValue: T): number[] {
	return array
		.map((value, index) => (value === testValue ? index : -1))
		.filter((index) => index !== -1)
}
