import { nonNullish } from '@dfinity/utils';
import type { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Utils } from 'alchemy-sdk';

const ETHEREUM_DEFAULT_DECIMALS = 18;

export const formatTokenShort = ({
	value,
	unitName = ETHEREUM_DEFAULT_DECIMALS,
	displayDecimals = 4
}: {
	value: BigNumber;
	unitName?: string | BigNumberish;
	displayDecimals?: number;
}): string => {
	const res = Utils.formatUnits(value, unitName);
	return (+res).toFixed(displayDecimals).replace(/(\.0+|0+)$/, '');
};

export const formatTokenDetailed = ({
	value,
	unitName = ETHEREUM_DEFAULT_DECIMALS,
	displayDecimals
}: {
	value: BigNumber;
	unitName?: string | BigNumberish;
	displayDecimals?: number;
}): string => {
	const res = Utils.formatUnits(value, unitName);

	const minimumFractionDigits = displayDecimals ?? 4;
	const maximumFractionDigits =
		displayDecimals ??
		(typeof unitName === 'number' ? (unitName as number) : ETHEREUM_DEFAULT_DECIMALS);

	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits,
		...(maximumFractionDigits > minimumFractionDigits && { maximumFractionDigits })
	})
		.format(+res)
		.replace(/(\.0+|0+)$/, '');
};

/**
 * Shortens the text from the middle. Ex: "12345678901234567890" -> "1234567...5678901"
 * @param text
 * @param splitLength An optional length for the split. e.g. 12345678 becomes, if splitLength = 2, 12...78
 * @returns text
 */
export const shortenWithMiddleEllipsis = (text: string, splitLength = 7): string => {
	// Original min length was 16 to extract 7 split
	const minLength = splitLength * 2 + 2;
	return text.length > minLength
		? `${text.slice(0, splitLength)}...${text.slice(-1 * splitLength)}`
		: text;
};

export const formatToDate = (seconds: number): string => {
	const options: Intl.DateTimeFormatOptions = {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	};

	const date = new Date(seconds * 1000);
	return date.toLocaleDateString('en', options);
};

export const formatUSD = (
	value: number,
	options?: {
		minFraction: number;
		maxFraction: number;
		maximumSignificantDigits?: number;
		symbol: boolean;
	}
): string => {
	const {
		minFraction = 2,
		maxFraction = 2,
		maximumSignificantDigits,
		symbol = false
	} = options || {};

	return new Intl.NumberFormat('en-US', {
		...(symbol && { style: 'currency', currency: 'USD' }),
		minimumFractionDigits: minFraction,
		maximumFractionDigits: maxFraction,
		...(nonNullish(maximumSignificantDigits) && { maximumSignificantDigits })
	})
		.format(value)
		.replace(/,/g, '’');
};
