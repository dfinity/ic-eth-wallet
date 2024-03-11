import type { EthereumChainId, EthereumNetwork } from '$eth/types/network';
import eth from '$icp-eth/assets/eth.svg';
import icpLight from '$icp/assets/icp_light.svg';
import { LOCAL } from '$lib/constants/app.constants';
import type { Network } from '$lib/types/network';

/**
 * Ethereum
 */
export const ETHEREUM_NETWORK: EthereumNetwork = {
	id: Symbol('ETH'),
	name: 'Ethereum',
	chainId: 1n,
	icon: eth
};

export const { id: ETHEREUM_NETWORK_ID, chainId: ETHEREUM_NETWORK_CHAIN_ID } = ETHEREUM_NETWORK;

export const SEPOLIA_NETWORK: EthereumNetwork = {
	id: Symbol('SepoliaETH'),
	name: 'Sepolia',
	chainId: 11155111n,
	icon: eth
};

export const { id: SEPOLIA_NETWORK_ID, chainId: SEPOLIA_NETWORK_CHAIN_ID } = SEPOLIA_NETWORK;

export const ETHEREUM_NETWORKS: [...EthereumNetwork[], EthereumNetwork] = [
	...(LOCAL ? [] : [ETHEREUM_NETWORK]),
	SEPOLIA_NETWORK
];

export const ETHEREUM_NETWORKS_IDS: symbol[] = ETHEREUM_NETWORKS.map(({ id }) => id);

export const ETHEREUM_NETWORKS_CHAIN_IDS: EthereumChainId[] = ETHEREUM_NETWORKS.map(
	({ chainId }) => chainId
);

/**
 * ICP
 */
export const ICP_NETWORK_SYMBOL = 'ICP';

export const ICP_NETWORK_ID = Symbol(ICP_NETWORK_SYMBOL);

export const ICP_NETWORK: Network = {
	id: ICP_NETWORK_ID,
	name: 'Internet Computer',
	icon: icpLight
};
