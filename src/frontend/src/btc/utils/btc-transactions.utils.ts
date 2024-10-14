import {
	CONFIRMED_BTC_TRANSACTION_MIN_CONFIRMATIONS,
	PENDING_BTC_TRANSACTION_MIN_CONFIRMATIONS
} from '$btc/constants/btc.constants';
import type { BtcTransactionUi } from '$btc/types/btc';
import type { BtcAddress } from '$lib/types/address';
import type { BitcoinTransaction } from '$lib/types/blockchain';
import { isNullish, nonNullish } from '@dfinity/utils';

export const mapBtcTransaction = ({
	transaction: { inputs, block_index, out, hash, time },
	btcAddress,
	latestBitcoinBlockHeight
}: {
	transaction: BitcoinTransaction;
	btcAddress: BtcAddress;
	latestBitcoinBlockHeight: number;
}): BtcTransactionUi => {
	const { totalInputValue, isTypeSend } = inputs.reduce<{
		totalInputValue: number;
		isTypeSend: boolean;
	}>(
		(acc, { prev_out: { value, addr } }) => ({
			totalInputValue: acc.totalInputValue + value,
			isTypeSend: !acc.isTypeSend ? addr === btcAddress : acc.isTypeSend
		}),
		{
			totalInputValue: 0,
			isTypeSend: false
		}
	);

	const { totalOutputValue, value, to } = out.reduce<{
		totalOutputValue: number;
		value: number | undefined;
		to: string | undefined;
	}>(
		(acc, { addr, value }) => {
			const isValidOutput =
				(isTypeSend && addr !== btcAddress) || (!isTypeSend && addr === btcAddress);

			if (isNullish(acc.value) && isValidOutput) {
				acc.value = (acc.value ?? 0) + value;
			}

			if (isNullish(acc.to) && isValidOutput) {
				acc.to = addr;
			}

			return {
				...acc,
				totalOutputValue: acc.totalOutputValue + value
			};
		},
		{
			totalOutputValue: 0,
			value: undefined,
			to: undefined
		}
	);

	const utxosFee = totalInputValue - totalOutputValue;

	const confirmations = nonNullish(block_index)
		? latestBitcoinBlockHeight - block_index
		: undefined;

	const status =
		isNullish(confirmations) || confirmations <= PENDING_BTC_TRANSACTION_MIN_CONFIRMATIONS
			? 'pending'
			: confirmations >= CONFIRMED_BTC_TRANSACTION_MIN_CONFIRMATIONS
				? 'confirmed'
				: 'unconfirmed';

	return {
		id: hash,
		timestamp: BigInt(time),
		value: nonNullish(value) ? BigInt(isTypeSend ? value + utxosFee : value) : undefined,
		status,
		blockNumber: block_index ?? undefined,
		type: isTypeSend ? 'send' : 'receive',
		from: isTypeSend ? btcAddress : inputs[0].prev_out.addr,
		to
	};
};
