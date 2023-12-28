import { ICP_INDEX_CANISTER_ID, ICP_WALLET_PAGINATION } from '$lib/constants/icp.constants';
import { getAgent } from '$lib/ic/agent.ic';
import type { OptionIdentity } from '$lib/types/identity';
import { getAccountIdentifier } from '$lib/utils/icp-account.utils';
import { IndexCanister, type GetAccountIdentifierTransactionsResponse } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';
import { assertNonNullish } from '@dfinity/utils';

export const getTransactions = async ({
	owner,
	identity,
	start,
	maxResults = ICP_WALLET_PAGINATION
}: {
	owner: Principal;
	identity: OptionIdentity;
	start?: bigint;
	maxResults?: bigint;
}): Promise<GetAccountIdentifierTransactionsResponse> => {
	assertNonNullish(identity, 'No internet identity.');

	const agent = await getAgent({ identity });

	const { getTransactions } = IndexCanister.create({
		agent,
		canisterId: Principal.fromText(ICP_INDEX_CANISTER_ID)
	});

	return getTransactions({
		certified: false,
		start,
		maxResults,
		accountIdentifier: getAccountIdentifier(owner).toHex()
	});
};
