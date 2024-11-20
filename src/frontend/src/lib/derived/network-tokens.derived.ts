import { exchanges } from '$lib/derived/exchange.derived';
import { pseudoNetworkChainFusion, selectedNetwork } from '$lib/derived/network.derived';
import { enabledTokens, tokensToPin } from '$lib/derived/tokens.derived';
import { balancesStore } from '$lib/stores/balances.store';
import type { Token, TokenUi } from '$lib/types/token';
import { filterTokensForSelectedNetwork } from '$lib/utils/network.utils';
import { pinTokensWithBalanceAtTop, sortTokens } from '$lib/utils/tokens.utils';
import { derived, type Readable } from 'svelte/store';
import { icTransactionsStore } from '$icp/stores/ic-transactions.store';
import { btcTransactionsStore } from '$btc/stores/btc-transactions.store';
import { ethTransactionsStore } from '$eth/stores/eth-transactions.store';

/**
 * All user-enabled tokens matching the selected network or chain fusion.
 */
// TODO: Create tests for this store
export const enabledNetworkTokens: Readable<Token[]> = derived(
	[enabledTokens, selectedNetwork, pseudoNetworkChainFusion],
	filterTokensForSelectedNetwork
);

/**
 * Network tokens sorted by market cap, with the ones to pin at the top of the list.
 */
export const combinedDerivedSortedNetworkTokens: Readable<Token[]> = derived(
	[enabledNetworkTokens, tokensToPin, exchanges],
	([$tokens, $tokensToPin, $exchanges]) => sortTokens({ $tokens, $exchanges, $tokensToPin })
);

/**
 * All tokens matching the selected network or Chain Fusion, with the ones with non-null balance at the top of the list.
 */
export const combinedDerivedSortedNetworkTokensUi: Readable<TokenUi[]> = derived(
	[combinedDerivedSortedNetworkTokens, balancesStore, exchanges],
	([$enabledNetworkTokens, $balances, $exchanges]) =>
		pinTokensWithBalanceAtTop({
			$tokens: $enabledNetworkTokens,
			$balances,
			$exchanges
		})
);

/**
 * All user-enabled tokens matching the selected network or chain fusion that do not have an index canister.
 */
export const enabledNetworkTokensWithoutIndexCanister: Readable<Token[]> = derived(
	[enabledNetworkTokens, btcTransactionsStore, ethTransactionsStore, icTransactionsStore],
	([$enabledNetworkTokens, $btcTransactionsStore, $ethTransactionsStore, $icTransactionsStore ]) =>
		$enabledNetworkTokens.filter(
				(token: Token) =>
					$btcTransactionsStore?.[token.id] === null ||
					$ethTransactionsStore?.[token.id] === null ||
					$icTransactionsStore?.[token.id] === null
			)
)