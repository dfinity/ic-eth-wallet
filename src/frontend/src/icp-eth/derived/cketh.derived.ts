import { ETHEREUM_TOKEN } from '$env/tokens.env';
import { ERC20_TWIN_TOKENS_IDS } from '$env/tokens.erc20.env';
import { ethereumToken, ethereumTokenId } from '$eth/derived/token.derived';
import { enabledEthereumTokens } from '$eth/derived/tokens.derived';
import type { EthereumNetwork } from '$eth/types/network';
import { ckEthMinterInfoStore } from '$icp-eth/stores/cketh.store';
import {
	toCkErc20HelperContractAddress,
	toCkEthHelperContractAddress,
	toCkMinterAddress
} from '$icp-eth/utils/cketh.utils';
import { tokenWithFallbackAsIcToken } from '$icp/derived/ic-token.derived';
import type { IcCkToken } from '$icp/types/ic';
import { isTokenCkErc20Ledger, isTokenCkEthLedger } from '$icp/utils/ic-send.utils';
import { DEFAULT_ETHEREUM_TOKEN } from '$lib/constants/tokens.constants';
import { tokenStandard, tokenWithFallback } from '$lib/derived/token.derived';
import { balancesStore } from '$lib/stores/balances.store';
import type { OptionEthAddress } from '$lib/types/address';
import type { NetworkId } from '$lib/types/network';
import type { Token, TokenId, TokenStandard } from '$lib/types/token';
import type { BigNumber } from '@ethersproject/bignumber';
import { derived, type Readable } from 'svelte/store';

/**
 * ETH to ckETH is supported:
 * - on network Ethereum if the token is Ethereum (and not some ERC20 token)
 * - on network ICP if the token is ckETH
 */
export const ethToCkETHEnabled: Readable<boolean> = derived(
	[tokenStandard, tokenWithFallbackAsIcToken],
	([$tokenStandard, $tokenWithFallbackAsIcToken]) =>
		$tokenStandard === 'ethereum' || isTokenCkEthLedger($tokenWithFallbackAsIcToken)
);

/**
 * ERC20 to ckErc20 is supported:
 * - on network Ethereum if the token is a known Erc20 twin tokens
 * - on network ICP if the token is ckErc20
 */
export const erc20ToCkErc20Enabled: Readable<boolean> = derived(
	[tokenWithFallbackAsIcToken],
	([$tokenWithFallbackAsIcToken]) =>
		ERC20_TWIN_TOKENS_IDS.includes($tokenWithFallbackAsIcToken.id) ||
		isTokenCkErc20Ledger($tokenWithFallbackAsIcToken)
);

/**
 * On ckETH, we need to know if the target for conversion is Ethereum mainnet or Sepolia.
 */
export const ckEthereumTwinToken: Readable<Token> = derived(
	[tokenWithFallback],
	([$tokenWithFallback]) => ($tokenWithFallback as IcCkToken)?.twinToken ?? ETHEREUM_TOKEN
);

export const ckEthereumTwinTokenId: Readable<TokenId> = derived(
	[ckEthereumTwinToken],
	([{ id }]) => id
);

export const ckEthereumTwinTokenStandard: Readable<TokenStandard> = derived(
	[ckEthereumTwinToken],
	([{ standard }]) => standard
);

export const ckEthereumTwinTokenNetwork: Readable<EthereumNetwork> = derived(
	[ckEthereumTwinToken],
	([{ network }]) => network as EthereumNetwork
);

export const ckEthereumTwinTokenNetworkId: Readable<NetworkId> = derived(
	[ckEthereumTwinTokenNetwork],
	([{ id }]) => id
);

/**
 * The fees to convert from Erc20 to ckErc20 or Eth to ckEth are covered by Ethereum (mainnet or sepolia) - i.e. not in erc20 value.
 * Likewise, when we load ckEth minter information we only load those once per network for any ckErc20 and ckEth given that it contains the information for all Ethereum related tokens.
 */
export const ckEthereumNativeToken: Readable<Token> = derived(
	[enabledEthereumTokens, ckEthereumTwinToken],
	([
		$enabledEthereumTokens,
		{
			network: { id }
		}
	]) =>
		$enabledEthereumTokens.find(({ network: { id: networkId } }) => id === networkId) ??
		DEFAULT_ETHEREUM_TOKEN
);

export const ckEthereumNativeTokenId: Readable<TokenId> = derived(
	[ckEthereumNativeToken],
	([{ id }]) => id
);

export const ckEthereumNativeTokenBalance: Readable<BigNumber | undefined | null> = derived(
	[balancesStore, ckEthereumNativeToken],
	([$balanceStore, { id }]) => $balanceStore?.[id]?.data
);

const ckEthMinterInfoInitialized: Readable<boolean> = derived(
	[ckEthMinterInfoStore],
	([$ckEthMinterInfoStore]) => $ckEthMinterInfoStore !== undefined
);

export const ckEthMinterInfoNotInitialized: Readable<boolean> = derived(
	[ckEthMinterInfoInitialized],
	($ckEthMinterInfoInitialized) => !$ckEthMinterInfoInitialized
);

/**
 * The contract helper used to convert ETH -> ckETH.
 */
export const ckEthHelperContractAddress: Readable<OptionEthAddress> = derived(
	[ckEthMinterInfoStore, ethereumTokenId, ethereumToken],
	([$ckEthMinterInfoStore, $ethereumTokenId, $ethereumToken]) =>
		toCkEthHelperContractAddress(
			$ckEthMinterInfoStore?.[$ethereumTokenId],
			$ethereumToken.network.id
		)
);

/**
 * The contract helper used to convert Erc20 -> ckErc20.
 */
export const ckErc20HelperContractAddress: Readable<OptionEthAddress> = derived(
	[ckEthMinterInfoStore, ethereumTokenId],
	([$ckEthMinterInfoStore, $ethereumTokenId]) =>
		toCkErc20HelperContractAddress($ckEthMinterInfoStore?.[$ethereumTokenId])
);

/**
 * The minter address.
 */
const ckMinterAddress: Readable<OptionEthAddress> = derived(
	[ckEthMinterInfoStore, ethereumTokenId],
	([$ckEthMinterInfoStore, $ethereumTokenId]) =>
		toCkMinterAddress($ckEthMinterInfoStore?.[$ethereumTokenId])
);

export const ckMinterInfoAddresses: Readable<OptionEthAddress[]> = derived(
	[ckEthHelperContractAddress, ckErc20HelperContractAddress, ckMinterAddress],
	([$ckEthHelperContractAddress, $ckErc20HelperContractAddress, $ckMinterAddress]) =>
		[$ckEthHelperContractAddress, $ckErc20HelperContractAddress, $ckMinterAddress].map((address) =>
			address?.toLowerCase()
		)
);
