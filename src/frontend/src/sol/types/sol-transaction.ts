import { solTransactionTypes } from '$lib/schema/transaction.schema';
import type { TransactionType, TransactionUiCommon } from '$lib/types/transaction';
import type {
	Address,
	Base58EncodedBytes,
	Commitment,
	Lamports,
	Reward,
	TokenBalance,
	TransactionError,
	UnixTimestamp
} from '@solana/web3.js';

export type SolTransactionType = Extract<
	TransactionType,
	(typeof solTransactionTypes.options)[number]
>;

export interface SolRpcTransaction {
	id: string;
	blockTime: UnixTimestamp | null;
	confirmationStatus: Commitment | null;
	meta: {
		computeUnitsConsumed?: bigint;
		err: TransactionError | null;
		fee: Lamports;
		logMessages: readonly string[] | null;
		postBalances: readonly Lamports[];
		postTokenBalances?: readonly TokenBalance[];
		preBalances: readonly Lamports[];
		preTokenBalances?: readonly TokenBalance[];
		rewards: readonly Reward[] | null;
	} | null;
	transaction: {
		message: {
			accountKeys: readonly Address[];
			instructions: readonly {
				accounts: readonly number[];
				data: Base58EncodedBytes;
				programIdIndex: number;
				stackHeight?: number;
			}[];
		};
	};
}

export interface SolTransactionUi extends TransactionUiCommon {
	id: string;
	type: SolTransactionType;
	status: Commitment | null;
	value?: bigint;
	fee?: bigint;
}
