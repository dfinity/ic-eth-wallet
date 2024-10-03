import type {
	_SERVICE as BackendService,
	CustomToken,
	PendingTransaction,
	SelectedUtxosFeeResponse,
	UserProfile,
	UserToken
} from '$declarations/backend/backend.did';
import { idlFactory as idlCertifiedFactoryBackend } from '$declarations/backend/backend.factory.certified.did';
import { idlFactory as idlFactoryBackend } from '$declarations/backend/backend.factory.did';
import { getAgent } from '$lib/actors/agents.ic';
import {
	mapBtcPendingTransactionError,
	mapBtcSelectUserUtxosFeeError
} from '$lib/canisters/backend.errors';
import type {
	AddUserCredentialParams,
	AddUserCredentialResponse,
	BtcAddPendingTransactionParams,
	BtcGetPendingTransactionParams,
	BtcSelectUserUtxosFeeParams,
	GetUserProfileResponse
} from '$lib/types/api';
import type { AllowSigningResponse } from '$lib/types/backend';
import type { CreateCanisterOptions } from '$lib/types/canister';
import { Canister, createServices, toNullable, type QueryParams } from '@dfinity/utils';

export class BackendCanister extends Canister<BackendService> {
	static async create({ identity, ...options }: CreateCanisterOptions<BackendService>) {
		const agent = await getAgent({ identity });

		const { service, certifiedService, canisterId } = createServices<BackendService>({
			options: {
				...options,
				agent
			},
			idlFactory: idlFactoryBackend,
			certifiedIdlFactory: idlCertifiedFactoryBackend
		});

		return new BackendCanister(canisterId, service, certifiedService);
	}

	listUserTokens = async ({ certified = true }: QueryParams): Promise<UserToken[]> => {
		const { list_user_tokens } = this.caller({ certified });

		return list_user_tokens();
	};

	listCustomTokens = async ({ certified = true }: QueryParams): Promise<CustomToken[]> => {
		const { list_custom_tokens } = this.caller({ certified });

		return list_custom_tokens();
	};

	setManyCustomTokens = async ({ tokens }: { tokens: CustomToken[] }): Promise<void> => {
		const { set_many_custom_tokens } = this.caller({ certified: true });

		return set_many_custom_tokens(tokens);
	};

	setCustomToken = async ({ token }: { token: CustomToken }): Promise<void> => {
		const { set_custom_token } = this.caller({ certified: true });

		return set_custom_token(token);
	};

	setManyUserTokens = async ({ tokens }: { tokens: UserToken[] }): Promise<void> => {
		const { set_many_user_tokens } = this.caller({ certified: true });

		return set_many_user_tokens(tokens);
	};

	setUserToken = async ({ token }: { token: UserToken }): Promise<void> => {
		const { set_user_token } = this.caller({ certified: true });

		return set_user_token(token);
	};

	createUserProfile = async (): Promise<UserProfile> => {
		const { create_user_profile } = this.caller({ certified: true });

		return create_user_profile();
	};

	getUserProfile = async ({ certified = true }: QueryParams): Promise<GetUserProfileResponse> => {
		const { get_user_profile } = this.caller({ certified });

		return get_user_profile();
	};

	addUserCredential = async ({
		credentialJwt,
		issuerCanisterId,
		currentUserVersion,
		credentialSpec
	}: AddUserCredentialParams): Promise<AddUserCredentialResponse> => {
		const { add_user_credential } = this.caller({ certified: true });

		return add_user_credential({
			credential_jwt: credentialJwt,
			issuer_canister_id: issuerCanisterId,
			current_user_version: toNullable(currentUserVersion),
			credential_spec: credentialSpec
		});
	};

	btcAddPendingTransaction = async ({
		txId,
		...rest
	}: BtcAddPendingTransactionParams): Promise<boolean> => {
		const { btc_add_pending_transaction } = this.caller({ certified: true });

		const response = await btc_add_pending_transaction({
			txid: txId,
			...rest
		});

		if ('Err' in response) {
			throw mapBtcPendingTransactionError(response.Err);
		}

		return 'Ok' in response;
	};

	btcGetPendingTransaction = async ({
		network,
		address
	}: BtcGetPendingTransactionParams): Promise<PendingTransaction[]> => {
		const { btc_get_pending_transactions } = this.caller({ certified: true });

		const response = await btc_get_pending_transactions({
			network,
			address
		});

		if ('Err' in response) {
			throw mapBtcPendingTransactionError(response.Err);
		}

		return response.Ok.transactions;
	};

	btcSelectUserUtxosFee = async ({
		network,
		minConfirmations,
		amountSatoshis,
		sourceAddress
	}: BtcSelectUserUtxosFeeParams): Promise<SelectedUtxosFeeResponse> => {
		const { btc_select_user_utxos_fee } = this.caller({ certified: true });

		const response = await btc_select_user_utxos_fee({
			network,
			min_confirmations: minConfirmations,
			amount_satoshis: amountSatoshis,
			source_address: sourceAddress
		});

		if ('Err' in response) {
			throw mapBtcSelectUserUtxosFeeError(response.Err);
		}

		return response.Ok;
	};

	allowSigning = async (): Promise<AllowSigningResponse> => {
		const { allow_signing } = this.caller({ certified: true });

		return allow_signing();
	};
}
