import type { CertifiedSetterStoreStore } from '$lib/stores/certified-setter.store';
import {
	initSetterStore,
	type SetterStoreData,
	type WritableUpdateStore
} from '$lib/stores/setter.store';
import type { CertifiedData } from '$lib/types/store';

export type CertifiedStoreData<T extends CertifiedData<unknown>> = SetterStoreData<T>;

export type CertifiedStore<T extends CertifiedData<unknown>> = Omit<
	CertifiedSetterStoreStore<T>,
	'set'
>;

export const initCertifiedStore = <T extends CertifiedData<unknown>>(): CertifiedStore<T> &
	WritableUpdateStore<T> => {
	const { update, subscribe, reset } = initSetterStore<T>();

	return {
		update,
		subscribe,
		reset
	};
};
