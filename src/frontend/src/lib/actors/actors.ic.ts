import type { _SERVICE as BackendActor } from '$declarations/backend/backend.did';
import { idlFactory as idlFactorBackend } from '$declarations/backend/backend.factory.did';
import { BACKEND_CANISTER_ID } from '$lib/constants/app.constants';
import type { OptionIdentity } from '$lib/types/identity';
import { Actor, type ActorMethod, type ActorSubclass, type Identity } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';
import type { Principal } from '@dfinity/principal';
import { assertNonNullish, isNullish } from '@dfinity/utils';
import { getAgent } from './agents.ic';

let actors: { backend?: BackendActor } | undefined | null = undefined;

export const getBackendActor = async ({
	identity
}: {
	identity: OptionIdentity;
}): Promise<BackendActor> => {
	assertNonNullish(identity, 'No internet identity.');

	const { backend } = actors ?? { backend: undefined };

	if (isNullish(backend)) {
		const actor = await createActor<BackendActor>({
			canisterId: BACKEND_CANISTER_ID,
			idlFactory: idlFactorBackend,
			identity
		});

		actors = {
			...(actors ?? {}),
			backend: actor
		};

		return actor;
	}

	return backend;
};

export const clearActors = () => (actors = null);

const createActor = async <T = Record<string, ActorMethod>>({
	canisterId,
	idlFactory,
	identity
}: {
	canisterId: string | Principal;
	idlFactory: IDL.InterfaceFactory;
	identity: Identity;
}): Promise<ActorSubclass<T>> => {
	const agent = await getAgent({ identity });

	// Creates an actor with using the candid interface and the HttpAgent
	return Actor.createActor(idlFactory, {
		agent,
		canisterId
	});
};
