import {
	icrc1Transfer as icrc1TransferIcp,
	transfer as transferIcp
} from '$icp/api/icp-ledger.api';
import { transfer as transferIcrc } from '$icp/api/icrc-ledger.api';
import { INDEX_RELOAD_DELAY } from '$icp/constants/ic.constants';
import { convertCkBTCToBtc, convertCkETHToEth } from '$icp/services/ck.services';
import type { IcToken } from '$icp/types/ic';
import type { IcTransferParams } from '$icp/types/ic-send';
import { isNetworkIdBTC, isNetworkIdETH } from '$icp/utils/ic-send.utils';
import { invalidIcpAddress } from '$icp/utils/icp-account.utils';
import { invalidIcrcAddress } from '$icp/utils/icrc-account.utils';
import { SendIcStep } from '$lib/enums/steps';
import type { NetworkId } from '$lib/types/network';
import { emit } from '$lib/utils/events.utils';
import { waitForMilliseconds } from '$lib/utils/timeout.utils';
import type { BlockHeight } from '@dfinity/ledger-icp';
import { decodeIcrcAccount, type IcrcBlockIndex } from '@dfinity/ledger-icrc';

export const sendIc = async ({
	progress,
	...rest
}: IcTransferParams & {
	token: IcToken;
	targetNetworkId: NetworkId | undefined;
}): Promise<void> => {
	await send({
		progress,
		...rest
	});

	progress(SendIcStep.RELOAD);

	await waitForMilliseconds(INDEX_RELOAD_DELAY);

	// Best case scenario, the transaction has already been noticed by the index canister after INDEX_RELOAD_DELAY seconds
	emit({ message: 'oisyTriggerWallet' });

	// In case the best case scenario was not met, we optimistically try to retrieve the transactions on more time given that we generally retrieve transactions every WALLET_TIMER_INTERVAL_MILLIS seconds
	waitForMilliseconds(INDEX_RELOAD_DELAY).then(() => emit({ message: 'oisyTriggerWallet' }));
};

const send = async ({
	token,
	targetNetworkId,
	...rest
}: IcTransferParams & {
	token: IcToken;
	targetNetworkId: NetworkId | undefined;
}): Promise<void> => {
	if (isNetworkIdBTC(targetNetworkId)) {
		await convertCkBTCToBtc({
			...rest,
			token
		});
		return;
	}

	if (isNetworkIdETH(targetNetworkId)) {
		await convertCkETHToEth({
			...rest,
			token
		});
		return;
	}

	const { standard, ledgerCanisterId } = token;

	if (standard === 'icrc') {
		await sendIcrc({
			...rest,
			ledgerCanisterId
		});
		return;
	}

	await sendIcp({
		...rest
	});
};

const sendIcrc = async ({
	to,
	amount,
	identity,
	ledgerCanisterId,
	progress
}: IcTransferParams & Pick<IcToken, 'ledgerCanisterId'>): Promise<IcrcBlockIndex> => {
	const validIcrcAddress = !invalidIcrcAddress(to);

	// UI validates addresses and disable form if not compliant. Therefore, this issue should unlikely happen.
	if (!validIcrcAddress) {
		throw new Error('The address is invalid. Please try again with a valid address identifier.');
	}

	progress(SendIcStep.SEND);

	return transferIcrc({
		identity,
		ledgerCanisterId,
		to: decodeIcrcAccount(to),
		amount: amount.toBigInt()
	});
};

const sendIcp = async ({
	to,
	amount,
	identity,
	progress
}: IcTransferParams): Promise<BlockHeight> => {
	const validIcrcAddress = !invalidIcrcAddress(to);
	const validIcpAddress = !invalidIcpAddress(to);

	// UI validates addresses and disable form if not compliant. Therefore, this issue should unlikely happen.
	if (!validIcrcAddress && !validIcpAddress) {
		throw new Error('The address is invalid. Please try again with a valid address identifier.');
	}

	progress(SendIcStep.SEND);

	return validIcrcAddress
		? icrc1TransferIcp({
				identity,
				to: decodeIcrcAccount(to),
				amount: amount.toBigInt()
			})
		: transferIcp({
				identity,
				to,
				amount: amount.toBigInt()
			});
};
