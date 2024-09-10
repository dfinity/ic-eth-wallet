import { CKETH_HELPER_CONTRACT_ADDRESS_MAINNET } from '$env/networks.cketh.env';
import { ETHEREUM_NETWORK_ID } from '$env/networks.env';
import type { OptionCertifiedMinterInfo } from '$icp-eth/types/cketh-minter';
import type { OptionEthAddress } from '$lib/types/address';
import type { NetworkId } from '$lib/types/network';
import { fromNullable } from '@dfinity/utils';

export const toCkEthHelperContractAddress = (
	minterInfo: OptionCertifiedMinterInfo,
	// TODO: to be removed once minterInfo breaking changes have been executed on mainnet
	networkId: NetworkId
): OptionEthAddress =>
	fromNullable(minterInfo?.data.eth_helper_contract_address ?? []) ??
	// TODO: to be removed once minterInfo breaking changes have been executed on mainnet
	(networkId === ETHEREUM_NETWORK_ID ? CKETH_HELPER_CONTRACT_ADDRESS_MAINNET : undefined);

export const toCkErc20HelperContractAddress = (
	minterInfo: OptionCertifiedMinterInfo
): OptionEthAddress => fromNullable(minterInfo?.data.erc20_helper_contract_address ?? []);

export const toCkMinterAddress = (minterInfo: OptionCertifiedMinterInfo): OptionEthAddress =>
	fromNullable(minterInfo?.data.minter_address ?? []);
