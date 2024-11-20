import { ETHERSCAN_MAX_CALLS_PER_SECOND } from '$env/rest/etherscan.env';
import { USDC_TOKEN } from '$env/tokens-erc20/tokens.usdc.env';
import { ETHEREUM_TOKEN, SEPOLIA_TOKEN } from '$env/tokens.env';
import {
	batchLoadTransactions,
	type ResultByToken
} from '$eth/services/eth-transactions-batch.services';
import { loadEthereumTransactions } from '$eth/services/eth-transactions.services';
import * as batchServices from '$lib/services/batch.services';
import { batch } from '$lib/services/batch.services';

vi.mock('$eth/services/eth-transactions.services', () => ({
	loadEthereumTransactions: vi.fn()
}));

describe('eth-transactions-batch.services', () => {
	describe('batchLoadTransactions', () => {
		const mockTokensNotLoaded = [ETHEREUM_TOKEN, SEPOLIA_TOKEN];
		const mockTokensAlreadyLoaded = [USDC_TOKEN];

		const mockTokens = [...mockTokensNotLoaded, ...mockTokensAlreadyLoaded];

		const mockTokensAlreadyLoadedIds = mockTokensAlreadyLoaded.map((token) => token.id);

		const mockTransactionResult = { success: true };

		const expectedReturn: PromiseSettledResult<ResultByToken>[] = mockTokensNotLoaded.map(
			(token) => ({
				status: 'fulfilled',
				value: { ...mockTransactionResult, tokenId: token.id }
			})
		);

		const batchSpy = vi.spyOn(batchServices, 'batch');

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it('should create promises for tokens not already loaded', async () => {
			vi.mocked(loadEthereumTransactions).mockImplementation(({ tokenId }) =>
				Promise.resolve({ ...mockTransactionResult, tokenId })
			);

			const generator = batchLoadTransactions({
				tokens: mockTokens,
				tokensAlreadyLoaded: mockTokensAlreadyLoadedIds
			});

			const result = await generator.next();

			expect(loadEthereumTransactions).toHaveBeenCalledTimes(mockTokensNotLoaded.length);
			mockTokensNotLoaded.forEach((token) => {
				expect(loadEthereumTransactions).toHaveBeenCalledWith({
					tokenId: token.id,
					networkId: token.network.id
				});
			});

			expect(batchSpy).toHaveBeenCalledWith({
				promises: expect.any(Array),
				batchSize: expect.any(Number)
			});

			expect(result.value).toEqual(expectedReturn);
		});

		it('should not call loadEthereumTransactions for tokens already loaded', () => {
			batchLoadTransactions({
				tokens: mockTokens,
				tokensAlreadyLoaded: mockTokensAlreadyLoadedIds
			});

			mockTokensAlreadyLoaded.forEach((token) => {
				expect(loadEthereumTransactions).not.toHaveBeenCalledWith({
					tokenId: token.id,
					networkId: token.network.id
				});
			});
		});

		it('should handle rejected promises gracefully', async () => {
			vi.mocked(loadEthereumTransactions).mockImplementation(({ tokenId }) =>
				tokenId === mockTokensNotLoaded[0].id
					? Promise.reject(new Error('Failed to load transactions'))
					: Promise.resolve({ ...mockTransactionResult, tokenId })
			);

			const expectedReturn = [
				{ status: 'rejected', reason: new Error('Failed to load transactions') },
				...mockTokens.slice(1).map((token) => ({
					status: 'fulfilled',
					value: { ...mockTransactionResult, tokenId: token.id }
				}))
			];

			const generator = batchLoadTransactions({
				tokens: mockTokens,
				tokensAlreadyLoaded: []
			});

			const result = await generator.next();

			expect(batch).toHaveBeenCalled();
			expect(result.value).toEqual(expectedReturn);
		});

		it('should respect ETHERSCAN_MAX_CALLS_PER_SECOND as batchSize', () => {
			batchLoadTransactions({
				tokens: mockTokens,
				tokensAlreadyLoaded: []
			});

			expect(batch).toHaveBeenCalledWith({
				promises: expect.any(Array),
				batchSize: ETHERSCAN_MAX_CALLS_PER_SECOND
			});
		});
	});
});
