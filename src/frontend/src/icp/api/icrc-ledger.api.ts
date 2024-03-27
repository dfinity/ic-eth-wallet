import { nowInBigIntNanoSeconds } from '$icp/utils/date.utils';
import { getAgent } from '$lib/actors/agents.ic';
import { i18n } from '$lib/stores/i18n.store';
import type { CanisterIdText } from '$lib/types/canister';
import type { OptionIdentity } from '$lib/types/identity';
import { type Identity } from '@dfinity/agent';
import {
	IcrcLedgerCanister,
	type IcrcAccount,
	type IcrcBlockIndex,
	type IcrcSubaccount,
	type IcrcTokenMetadataResponse
} from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';
import { assertNonNullish, toNullable, type QueryParams } from '@dfinity/utils';
import { get } from 'svelte/store';

export const metadata = async ({
	certified = true,
	identity,
	...rest
}: {
	identity: OptionIdentity;
	ledgerCanisterId: CanisterIdText;
} & QueryParams): Promise<IcrcTokenMetadataResponse> => {
	assertNonNullish(identity, get(i18n).auth.error.no_internet_identity);

	const { metadata } = await ledgerCanister({ identity, ...rest });

	return metadata({ certified });
};

export const transfer = async ({
	identity,
	to,
	amount,
	createdAt,
	ledgerCanisterId
}: {
	identity: OptionIdentity;
	to: IcrcAccount;
	amount: bigint;
	createdAt?: bigint;
	ledgerCanisterId: CanisterIdText;
}): Promise<IcrcBlockIndex> => {
	assertNonNullish(identity, get(i18n).auth.error.no_internet_identity);

	const { transfer } = await ledgerCanister({ identity, ledgerCanisterId });

	return transfer({
		to: toAccount(to),
		amount,
		created_at_time: createdAt ?? nowInBigIntNanoSeconds()
	});
};

export const approve = async ({
	identity,
	ledgerCanisterId,
	amount,
	spender,
	expiresAt: expires_at,
	createdAt
}: {
	identity: OptionIdentity;
	ledgerCanisterId: CanisterIdText;
	amount: bigint;
	spender: IcrcAccount;
	expiresAt: bigint;
	createdAt?: bigint;
}): Promise<IcrcBlockIndex> => {
	assertNonNullish(identity, get(i18n).auth.error.no_internet_identity);

	const { approve } = await ledgerCanister({ identity, ledgerCanisterId });

	return approve({
		amount,
		spender: toAccount(spender),
		expires_at,
		created_at_time: createdAt ?? nowInBigIntNanoSeconds()
	});
};

const toAccount = ({
	owner,
	subaccount
}: IcrcAccount): { owner: Principal; subaccount: [] | [IcrcSubaccount] } => ({
	owner,
	subaccount: toNullable(subaccount)
});

const ledgerCanister = async ({
	identity,
	ledgerCanisterId
}: {
	identity: Identity;
	ledgerCanisterId: CanisterIdText;
}): Promise<IcrcLedgerCanister> => {
	const agent = await getAgent({ identity });

	return IcrcLedgerCanister.create({
		agent,
		canisterId: Principal.fromText(ledgerCanisterId)
	});
};
