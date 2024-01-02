export function getIndicesMatchingValue<T>(array: T[], testValue: T): number[] {
	return array
		.map((value, index) => (value === testValue ? index : -1))
		.filter((index) => index !== -1)
}
