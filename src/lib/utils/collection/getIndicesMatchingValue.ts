export function getIndicesMatchingValue<T>(arr: T[], testValue: T): number[] {
	return arr.map((val, index) => (val === testValue ? index : -1)).filter((index) => index !== -1);
}
