import type { Principal } from '@dfinity/principal';
import { isNullish } from '@dfinity/utils';

// e.g. payloads.did/state_hash
export const isHash = (bytes: number[]): boolean =>
	bytes.length === 32 &&
	isNullish(bytes.find((value) => !Number.isInteger(value) || value < 0 || value > 255));

// Convert a byte array to a hex string
const bytesToHexString = (bytes: number[]): string =>
	bytes.reduce((str, byte) => `${str}${byte.toString(16).padStart(2, '0')}`, '');

export const isPrincipal = (value: unknown): value is Principal =>
	typeof value === 'object' && (value as Principal)?._isPrincipal === true;

/**
 * Transform bigint to string to avoid serialization error.
 * devMode transforms 123n -> "BigInt(123)"
 */
export const stringifyJson = ({
	value,
	options
}: {
	value: unknown;
	options?: {
		indentation?: number;
		devMode?: boolean;
	};
}): string =>
	JSON.stringify(
		value,
		(_, value) => {
			switch (typeof value) {
				case 'function':
					return 'f () { ... }';
				case 'symbol':
					return value.toString();
				case 'object': {
					// Represent Principals as strings rather than as byte arrays when serializing to JSON strings
					if (isPrincipal(value)) {
						const asText = value.toString();
						// To not stringify NOT Principal instance that contains _isPrincipal field
						return asText === '[object Object]' ? value : asText;
					}

					// optimistic hash stringifying
					if (Array.isArray(value) && isHash(value)) {
						return bytesToHexString(value);
					}

					if (value instanceof Promise) {
						return 'Promise(...)';
					}

					if (value instanceof ArrayBuffer) {
						return new Uint8Array(value).toString();
					}

					break;
				}
				case 'bigint': {
					// TODO: Remove ESLint exception and use nullish checks
					// eslint-disable-next-line local-rules/use-nullish-checks
					if (options?.devMode !== undefined && options.devMode) {
						return `BigInt('${value.toString()}')`;
					}
					return value.toString();
				}
			}
			return value;
		},
		options?.indentation ?? 0
	);
