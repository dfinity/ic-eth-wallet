import type { EnvIcrcTokenMetadata } from '$env/types/env-icrc-token';
import type { EnvSnsToken } from '$env/types/env-sns-token';
import type { IcToken, IcTokenWithoutId } from '$icp/types/ic-token';
import type { TokenToggleable, UserTokenState } from '$lib/types/token-toggleable';
import type { Option } from '$lib/types/utils';

export type IcrcCustomTokenExtra = Pick<EnvIcrcTokenMetadata, 'alternativeName'> &
	Partial<Pick<EnvSnsToken, 'indexCanisterVersion'>>;

export type IcTokenWithoutIdExtended = IcTokenWithoutId & IcrcCustomTokenExtra;

export type IcrcCustomTokenWithoutId = UserTokenState & IcTokenWithoutIdExtended;

export type IcrcCustomToken = TokenToggleable<IcToken> & IcrcCustomTokenExtra;

export type OptionIcrcCustomToken = Option<IcrcCustomToken>;
