import { REPLICA_HOST } from '$lib/constants/app.constants';
import type { Option } from '$lib/types/utils';
import type { Identity } from '@dfinity/agent';
import {
	ICRC21_CALL_CONSENT_MESSAGE,
	ICRC25_REQUEST_PERMISSIONS,
	ICRC27_ACCOUNTS,
	ICRC49_CALL_CANISTER,
	type AccountsPromptPayload,
	type CallCanisterPromptPayload,
	type ConsentMessagePromptPayload,
	type PermissionsPromptPayload
} from '@dfinity/oisy-wallet-signer';
import { Signer } from '@dfinity/oisy-wallet-signer/signer';
import { isNullish } from '@dfinity/utils';
import { derived, writable, type Readable } from 'svelte/store';

export interface SignerContext {
	init: (params: { owner: Identity }) => void;
	reset: () => void;
	idle: Readable<boolean>;
	permissionsPrompt: {
		payload: Readable<PermissionsPromptPayload | undefined | null>;
		reset: () => void;
	};
	consentMessagePrompt: {
		payload: Readable<ConsentMessagePromptPayload | undefined | null>;
		reset: () => void;
	};
	callCanisterPrompt: {
		payload: Readable<CallCanisterPromptPayload | undefined | null>;
		reset: () => void;
	};
}

export const initSignerContext = ({
	accountsPrompt
}: {
	accountsPrompt: (payload: AccountsPromptPayload) => void;
}): SignerContext => {
	let signer: Option<Signer>;

	const permissionsPromptPayloadStore = writable<PermissionsPromptPayload | undefined | null>(
		undefined
	);

	const consentMessagePromptPayloadStore = writable<ConsentMessagePromptPayload | undefined | null>(
		undefined
	);

	const callCanisterPromptPayloadStore = writable<CallCanisterPromptPayload | undefined | null>(
		undefined
	);

	const permissionsPromptPayload = derived(
		[permissionsPromptPayloadStore],
		([$permissionsPromptPayloadStore]) => $permissionsPromptPayloadStore
	);

	const consentMessagePromptPayload = derived(
		[consentMessagePromptPayloadStore],
		([$consentMessagePromptPayloadStore]) => $consentMessagePromptPayloadStore
	);

	const callCanisterPromptPayload = derived(
		[callCanisterPromptPayloadStore],
		([$callCanisterPromptPayloadStore]) => $callCanisterPromptPayloadStore
	);

	const idle = derived(
		[permissionsPromptPayload, consentMessagePromptPayload, callCanisterPromptPayload],
		([$permissionsPromptPayload, $consentMessagePromptPayload, $callCanisterPromptPayloadStore]) =>
			isNullish($permissionsPromptPayload) &&
			isNullish($consentMessagePromptPayload) &&
			isNullish($callCanisterPromptPayloadStore)
	);

	const init = ({ owner }: { owner: Identity }) => {
		signer = Signer.init({
			owner,
			host: REPLICA_HOST
		});

		signer.register({
			method: ICRC25_REQUEST_PERMISSIONS,
			prompt: (payload: PermissionsPromptPayload) => permissionsPromptPayloadStore.set(payload)
		});

		signer.register({
			method: ICRC27_ACCOUNTS,
			prompt: accountsPrompt
		});

		signer.register({
			method: ICRC21_CALL_CONSENT_MESSAGE,
			prompt: (payload: ConsentMessagePromptPayload) => {
				consentMessagePromptPayloadStore.set(payload);
			}
		});

		signer.register({
			method: ICRC49_CALL_CANISTER,
			prompt: (payload: CallCanisterPromptPayload) => {
				callCanisterPromptPayloadStore.set(payload);
			}
		});
	};

	const resetPermissionsPromptPayload = () => permissionsPromptPayloadStore.set(null);
	const resetConsentMessagePromptPayload = () => consentMessagePromptPayloadStore.set(null);
	const resetCallCanisterPromptPayload = () => callCanisterPromptPayloadStore.set(null);

	const reset = () => {
		resetPermissionsPromptPayload();
		resetConsentMessagePromptPayload();
		resetCallCanisterPromptPayload();

		signer?.disconnect();
		signer = null;
	};

	return {
		init,
		reset,
		idle,
		permissionsPrompt: {
			payload: permissionsPromptPayload,
			reset: resetPermissionsPromptPayload
		},
		consentMessagePrompt: {
			payload: consentMessagePromptPayload,
			reset: resetConsentMessagePromptPayload
		},
		callCanisterPrompt: {
			payload: callCanisterPromptPayload,
			reset: resetCallCanisterPromptPayload
		}
	};
};

export const SIGNER_CONTEXT_KEY = Symbol('signer');
