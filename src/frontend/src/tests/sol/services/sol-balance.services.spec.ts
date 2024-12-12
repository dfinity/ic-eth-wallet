import {
	SOLANA_DEVNET_TOKEN,
	SOLANA_TESTNET_TOKEN,
	SOLANA_TOKEN
} from '$env/tokens/tokens.sol.env';
import type { Token } from '$lib/types/token';
import { loadLamportsBalance, loadSolBalance } from '$sol/services/sol-balance.services';
import { mockSolAddress } from '$tests/mocks/sol.mock';

describe('sol-balance.services', () => {
	const solanaTokens: Token[] = [SOLANA_TOKEN, SOLANA_TESTNET_TOKEN, SOLANA_DEVNET_TOKEN];

	describe('loadLamportsBalance', () => {
		it.each(solanaTokens)(
			'should return the balance of the $name native token in lamports for the address',
			async (token) => {
				const balance = await loadLamportsBalance({ address: mockSolAddress, token });

				expect(balance).toBeGreaterThanOrEqual(0);
			}
		);
	}, 60000);

	describe('loadSolBalance', () => {
		it.each(solanaTokens)(
			'should return the balance in SOL of the $name native token for the address',
			async (token) => {
				const balance = await loadSolBalance({ address: mockSolAddress, token });

				expect(balance).toBeGreaterThanOrEqual(0);
			}
		);
	}, 60000);
});