import { erc20Tokens } from '$lib/derived/erc20.derived';
import { icrcTokens } from '$lib/derived/icrc.derived';
import { exchangeStore } from '$lib/stores/exchange.store';
import type { CoingeckoSimplePrice } from '$lib/types/coingecko';
import type { TokenId } from '$lib/types/token';
import { nonNullish } from '@dfinity/utils';
import { derived, type Readable } from 'svelte/store';

export const exchangeInitialized: Readable<boolean> = derived([exchangeStore], ([$exchangeStore]) =>
	nonNullish($exchangeStore)
);

export const exchanges: Readable<Record<TokenId, CoingeckoSimplePrice | undefined>> = derived(
	[exchangeStore, erc20Tokens, icrcTokens],
	([$exchangeStore, $erc20Tokens, $icrcTokens]) => {
		const ethPrice = $exchangeStore?.ethereum;
		const btcPrice = $exchangeStore?.bitcoin;
		const icpPrice = $exchangeStore?.['internet-computer'];

		return {
			ETHEREUM_TOKEN_ID: ethPrice,
			ICP_TOKEN_ID: icpPrice,
			...Object.entries($exchangeStore ?? {}).reduce((acc, [key, currentPrice]) => {
				const token = $erc20Tokens.find(
					({ address }) => address.toLowerCase() === key.toLowerCase()
				);

				return {
					...acc,
					...(nonNullish(token) && { tokenId: token.id, currentPrice })
				};
			}, {}),
			...$erc20Tokens
				.filter(({ exchange }) => exchange === 'icp')
				.reduce(
					(acc, { id }) => ({
						...acc,
						[id]: icpPrice
					}),
					{}
				),
			...$icrcTokens.reduce(
				(acc, { id, exchangeCoinId }) => ({
					...acc,
					[id]:
						exchangeCoinId === 'ethereum'
							? ethPrice
							: exchangeCoinId === 'bitcoin'
								? btcPrice
								: exchangeCoinId === 'internet-computer'
									? icpPrice
									: undefined
				}),
				{}
			)
		};
	}
);
