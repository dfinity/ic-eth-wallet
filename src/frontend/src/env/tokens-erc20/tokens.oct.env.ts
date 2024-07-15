import { ETHEREUM_NETWORK } from '$env/networks.env';
import type { EnvTokenErc20 } from '$env/types/env-token-erc20';
import oct from '$icp-eth/assets/oct.svg';

export const OCT_DECIMALS = 18;

export const OCT_SYMBOL = 'OCT';

export const OCT_TOKEN_ID: unique symbol = Symbol(OCT_SYMBOL);

export const OCT_TOKEN: EnvTokenErc20 = {
	id: OCT_TOKEN_ID,
	network: ETHEREUM_NETWORK,
	standard: 'erc20',
	category: 'default',
	name: 'Octopus Network Token',
	symbol: OCT_SYMBOL,
	decimals: OCT_DECIMALS,
	icon: oct,
	exchange: 'erc20',
	twinTokenSymbol: 'ckOCT'
};
