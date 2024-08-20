import { BTC_MAINNET_TOKEN_ID } from '$env/tokens.btc.env';
import { ETHEREUM_TOKEN_ID } from '$env/tokens.env';
import { addressStore, type AddressData } from '$lib/stores/address.store';
import type { OptionBtcAddress, OptionEthAddress } from '$lib/types/address';
import { isNullish } from '@dfinity/utils';
import { derived, type Readable } from 'svelte/store';

export const addressNotLoaded: Readable<boolean> = derived([addressStore], ([$addressStore]) =>
	isNullish($addressStore)
);

const btcAddressMainnetData: Readable<AddressData | null | undefined> = derived(
	[addressStore],
	([$addressStore]) => $addressStore?.[BTC_MAINNET_TOKEN_ID]
);

const ethAddressData: Readable<AddressData | null | undefined> = derived(
	[addressStore],
	([$addressStore]) => $addressStore?.[ETHEREUM_TOKEN_ID]
);

export const btcAddressMainnet: Readable<OptionBtcAddress> = derived(
	[btcAddressMainnetData],
	([$btcAddressMainnetData]) =>
		$btcAddressMainnetData === null ? null : $btcAddressMainnetData?.data
);

export const ethAddress: Readable<OptionEthAddress> = derived(
	[ethAddressData],
	([$ethAddressData]) => ($ethAddressData === null ? null : $ethAddressData?.data)
);

const btcAddressMainnetCertified: Readable<boolean> = derived(
	[btcAddressMainnetData],
	([$btcAddressMainnetData]) => $btcAddressMainnetData?.certified === true
);

export const btcAddressMainnetNotCertified: Readable<boolean> = derived(
	[btcAddressMainnetCertified],
	([$btcAddressMainnetCertified]) => !$btcAddressMainnetCertified
);

const ethAddressCertified: Readable<boolean> = derived(
	[ethAddressData],
	([$ethAddressData]) => $ethAddressData?.certified === true
);

export const ethAddressNotCertified: Readable<boolean> = derived(
	[ethAddressCertified],
	([$ethAddressCertified]) => !$ethAddressCertified
);

export const addressesCertified: Readable<boolean> = derived(
	[btcAddressMainnetCertified, ethAddressCertified],
	([$btcAddressMainnetCertified, $ethAddressCertified]) =>
		$btcAddressMainnetCertified && $ethAddressCertified
);
