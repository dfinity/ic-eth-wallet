import {
	onLoadTransactionsError,
	onTransactionsCleanUp
} from '$icp/services/ic-transactions.services';
import type { IcToken } from '$icp/types/ic';
import type {
	PostMessage,
	PostMessageDataResponseError,
	PostMessageDataResponseIcWallet,
	PostMessageDataResponseWalletCleanUp
} from '$lib/types/post-message';
import type { WalletWorker } from '$lib/types/wallet';
import type { IcrcGetTransactions } from '@dfinity/ledger-icrc';
import { syncWallet } from './ic-listener.services';

export const initIcrcWalletWorker = async ({
	indexCanisterId,
	ledgerCanisterId,
	id: tokenId,
	network: { env }
}: IcToken): Promise<WalletWorker> => {
	const WalletWorker = await import('$icp/workers/icrc-wallet.worker?worker');
	const worker: Worker = new WalletWorker.default();

	worker.onmessage = async ({
		data
	}: MessageEvent<
		PostMessage<
			| PostMessageDataResponseIcWallet<Omit<IcrcGetTransactions, 'transactions'>>
			| PostMessageDataResponseError
			| PostMessageDataResponseWalletCleanUp
		>
	>) => {
		const { msg } = data;

		switch (msg) {
			case 'syncIcrcWallet':
				syncWallet({
					tokenId,
					data: data.data as PostMessageDataResponseIcWallet<
						Omit<IcrcGetTransactions, 'transactions'>
					>
				});
				return;
			case 'syncIcrcWalletError':
				onLoadTransactionsError({
					tokenId,
					error: (data.data as PostMessageDataResponseError).error
				});
				return;
			case 'syncIcrcWalletCleanUp':
				onTransactionsCleanUp({
					tokenId,
					transactionIds: (data.data as PostMessageDataResponseWalletCleanUp).transactionIds
				});
				return;
		}
	};

	return {
		start: () => {
			worker.postMessage({
				msg: 'startIcrcWalletTimer',
				data: {
					indexCanisterId,
					ledgerCanisterId,
					env
				}
			});
		},
		stop: () => {
			worker.postMessage({
				msg: 'stopIcrcWalletTimer'
			});
		},
		trigger: () => {
			worker.postMessage({
				msg: 'triggerIcrcWalletTimer',
				data: {
					indexCanisterId,
					ledgerCanisterId,
					env
				}
			});
		}
	};
};
