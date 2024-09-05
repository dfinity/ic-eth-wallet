import { enabledBitcoinTokens } from '$btc/derived/tokens.derived';
import { BTC_MAINNET_TOKEN } from '$env/tokens.btc.env';
import { ETHEREUM_TOKEN, ICP_TOKEN } from '$env/tokens.env';
import { erc20Tokens } from '$eth/derived/erc20.derived';
import { enabledEthereumTokens } from '$eth/derived/tokens.derived';
import type { Erc20Token } from '$eth/types/erc20';
import { icrcChainFusionDefaultTokens, sortedIcrcTokens } from '$icp/derived/icrc.derived';
import type { IcToken } from '$icp/types/ic';
import { exchanges } from '$lib/derived/exchange.derived';
import { balancesStore } from '$lib/stores/balances.store';
import type { Token, TokenToPin } from '$lib/types/token';
import { filterEnabledTokens, sumMainnetTokensUsdBalance } from '$lib/utils/tokens.utils';
import { derived, type Readable } from 'svelte/store';

export const tokens: Readable<Token[]> = derived(
	[erc20Tokens, sortedIcrcTokens, enabledEthereumTokens, enabledBitcoinTokens],
	([$erc20Tokens, $icrcTokens, $enabledEthereumTokens, $enabledBitcoinTokens]) => [
		ICP_TOKEN,
		...$enabledBitcoinTokens,
		...$enabledEthereumTokens,
		...$erc20Tokens,
		...$icrcTokens
	]
);

export const tokensToPin: Readable<TokenToPin[]> = derived(
	[icrcChainFusionDefaultTokens],
	([$icrcChainFusionDefaultTokens]) => [
		ICP_TOKEN,
		BTC_MAINNET_TOKEN,
		ETHEREUM_TOKEN,
		...$icrcChainFusionDefaultTokens
	]
);

/**
 * All user-enabled tokens.
 */
export const enabledTokens: Readable<Token[]> = derived([tokens], filterEnabledTokens);

/**
 * It isn't performant to post filter again the Erc20 tokens that are enabled, but it's code wise convenient to avoid duplication of logic.
 */
export const enabledErc20Tokens: Readable<Erc20Token[]> = derived(
	[enabledTokens],
	([$enabledTokens]) =>
		$enabledTokens.filter(({ standard }) => standard === 'erc20') as Erc20Token[]
);

/**
 * The following store is use as reference for the list of WalletWorkers that are started/stopped in the main token page.
 */
// TODO: The several dependencies of enabledIcTokens are not strictly only IC tokens, but other tokens too.
//  We should find a better way to handle this, improving the store.
export const enabledIcTokens: Readable<IcToken[]> = derived(
	[enabledTokens],
	([$enabledTokens]) =>
		$enabledTokens.filter(({ standard }) => standard === 'icp' || standard === 'icrc') as IcToken[]
);

export const enabledMainnetErc20TokensTotalUsd: Readable<number> = derived(
	[enabledErc20Tokens, balancesStore, exchanges],
	([$enabledErc20Tokens, $balances, $exchanges]) =>
		sumMainnetTokensUsdBalance({ $tokens: $enabledErc20Tokens, $balances, $exchanges })
);

export const enabledMainnetIcTokensTotalUsd: Readable<number> = derived(
	[enabledIcTokens, balancesStore, exchanges],
	([$enabledIcTokens, $balances, $exchanges]) =>
		sumMainnetTokensUsdBalance({ $tokens: $enabledIcTokens, $balances, $exchanges })
);

export const enabledMainnetTokensTotalUsd: Readable<number> = derived(
	[enabledMainnetErc20TokensTotalUsd, enabledMainnetIcTokensTotalUsd],
	([$erc20TokensTotalUsd, $icTokensTotalUsd]) => $erc20TokensTotalUsd + $icTokensTotalUsd
);
