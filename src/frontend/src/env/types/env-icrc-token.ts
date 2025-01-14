import { EnvIcrcTokenMetadataSchema } from '$env/schema/env-icrc-token.schema';
import * as z from 'zod';

export type EnvIcrcTokenMetadata = z.infer<typeof EnvIcrcTokenMetadataSchema>;
