export default function uuidToBigInt (uuid: string): bigint {
	// Remove dashes and parse as hex (base 16)
	const hexString: string = '0x' + uuid.replace(/-/g, '');
	return BigInt(hexString);
}