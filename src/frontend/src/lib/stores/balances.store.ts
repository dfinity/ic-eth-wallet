import { initCertifiedSetterStore } from '$lib/stores/certified-setter.store';
import type { CertifiedData } from '$lib/types/store';
import type { TokenId } from '$lib/types/token';
import type { BigNumber } from '@ethersproject/bignumber';

export type BalancesData = CertifiedData<BigNumber>;

export const balancesStore = initCertifiedSetterStore<TokenId, BalancesData>();
