import { page } from '$app/stores';
import { AIRDROP } from '$lib/constants/airdrop.constants';
import { airdropStore } from '$lib/stores/airdrop.store';
import type { CodeText } from '$lib/types/airdrop';
import { nonNullish } from '@dfinity/utils';
import { derived, type Readable } from 'svelte/store';

export const airdropCode: Readable<CodeText | null | undefined> = derived([page], ([$page]) => {
	const {
		data: { airdrop }
	} = $page;

	return airdrop;
});

export const airdropAvailable: Readable<boolean> = derived(
	airdropStore,
	($airdrop) => nonNullish($airdrop) && AIRDROP
);
