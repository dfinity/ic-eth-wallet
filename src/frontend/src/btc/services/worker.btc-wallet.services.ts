import { syncWallet } from '$btc/services/btc-listener.services';
import {
	isNetworkIdBTCMainnet,
	isNetworkIdBTCRegtest,
	isNetworkIdBTCTestnet
} from '$icp/utils/ic-send.utils';
import {
	btcAddressMainnet,
	btcAddressRegtest,
	btcAddressTestnet
} from '$lib/derived/address.derived';
import type { WalletWorker } from '$lib/types/listener';
import type { PostMessage, PostMessageDataResponseWallet } from '$lib/types/post-message';
import type { Token } from '$lib/types/token';
import { mapToSignerBitcoinNetwork } from '$lib/utils/network.utils';
import { get } from 'svelte/store';

export const initBtcWalletWorker = async ({
	id: tokenId,
	network: { id: networkId }
}: Token): Promise<WalletWorker> => {
	const WalletWorker = await import('$btc/workers/btc-wallet.worker?worker');
	const worker: Worker = new WalletWorker.default();

	worker.onmessage = async ({ data }: MessageEvent<PostMessage<PostMessageDataResponseWallet>>) => {
		const { msg } = data;

		switch (msg) {
			case 'syncBtcWallet':
				syncWallet({
					tokenId,
					data: data.data as PostMessageDataResponseWallet
				});
				return;
		}
	};

	return {
		start: () => {
			const isNetworkTestnet = isNetworkIdBTCTestnet(networkId);
			const isNetworkRegtest = isNetworkIdBTCRegtest(networkId);
			const isNetworkMainnet = isNetworkIdBTCMainnet(networkId);

			worker.postMessage({
				msg: 'startBtcWalletTimer',
				data: {
					btcAddress: get(
						isNetworkTestnet
							? btcAddressTestnet
							: isNetworkRegtest
								? btcAddressRegtest
								: btcAddressMainnet
					),
					bitcoinNetwork: mapToSignerBitcoinNetwork({
						network: isNetworkTestnet ? 'testnet' : isNetworkRegtest ? 'regtest' : 'mainnet'
					}),
					// only mainnet transactions can be fetched via Blockchain API
					shouldFetchTransactions: isNetworkMainnet
				}
			});
		},
		stop: () => {
			worker.postMessage({
				msg: 'stopBtcWalletTimer'
			});
		},
		trigger: () => {
			worker.postMessage({
				msg: 'triggerBtcWalletTimer'
			});
		}
	};
};
