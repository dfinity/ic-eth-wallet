import { getBalanceUpdate } from '$btc/api/bitcoin.api';
import { WALLET_TIMER_INTERVAL_MILLIS } from '$icp/constants/ic.constants';
import { SchedulerTimer, type Scheduler, type SchedulerJobData } from '$lib/schedulers/scheduler';
import type {
	PostMessageDataRequestBtc,
	PostMessageDataResponseBtcWallet
} from '$lib/types/post-message';
import { assertNonNullish } from '@dfinity/utils';

export class WalletScheduler implements Scheduler<PostMessageDataRequestBtc> {
	private timer = new SchedulerTimer('syncBtcWalletStatus');

	stop() {
		this.timer.stop();
	}

	async start(data: PostMessageDataRequestBtc | undefined) {
		await this.timer.start<PostMessageDataRequestBtc>({
			interval: WALLET_TIMER_INTERVAL_MILLIS,
			job: this.syncWallet,
			data
		});
	}

	async trigger(data: PostMessageDataRequestBtc | undefined) {
		await this.timer.trigger<PostMessageDataRequestBtc>({
			job: this.syncWallet,
			data
		});
	}

	private syncWallet = async ({ identity, data }: SchedulerJobData<PostMessageDataRequestBtc>) => {
		const bitcoinNetwork = data?.bitcoinNetwork;

		assertNonNullish(bitcoinNetwork, 'No BTC network provided to get certified balance.');

		const certBalance = await getBalanceUpdate({
			identity,
			network: bitcoinNetwork
		});

		this.postMessageWallet({
			wallet: {
				balance: {
					data: certBalance,
					certified: true
				}
			}
		});
	};

	private postMessageWallet(data: PostMessageDataResponseBtcWallet) {
		this.timer.postMsg<PostMessageDataResponseBtcWallet>({
			msg: 'syncBtcWallet',
			data
		});
	}
}
