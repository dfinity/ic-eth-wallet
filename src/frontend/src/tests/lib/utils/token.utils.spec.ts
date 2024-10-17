import { ETHEREUM_TOKEN, ICP_TOKEN } from '$env/tokens.env';
import type { TokenGroupUi, TokenStandard, TokenUi } from '$lib/types/token';
import { usdValue } from '$lib/utils/exchange.utils';
import {
	calculateTokenUsdBalance,
	getMaxTransactionAmount, groupTokensByTwin,
	mapTokenUi
} from '$lib/utils/token.utils';
import { $balances, bn3 } from '$tests/mocks/balances.mock';
import { $exchanges } from '$tests/mocks/exchanges.mock';
import { BigNumber } from 'alchemy-sdk';
import { describe, expect, it, type MockedFunction } from 'vitest';
import { ICP_NETWORK } from '$env/networks.env';

const tokenDecimals = 8;
const tokenStandards: TokenStandard[] = ['ethereum', 'icp', 'icrc', 'bitcoin'];

const balance = 1000000000n;
const fee = 10000000n;

const tokens = [
	{
		symbol: "BTC",
		network: { id: Symbol("BTC"), name: "Bitcoin", icon: "btc-icon", iconBW: "btc-icon-bw", env: "mainnet" },
		twinTokenSymbol: "ckBTC",
		balance: BigNumber.from(1),
		usdBalance: 50000,
		standard: "bitcoin",
		category: "default",
		decimals: 8,
		name: "Bitcoin"
	},
	{
		symbol: "ckBTC",
		network: ICP_NETWORK,
		balance: BigNumber.from(2),
		usdBalance: 100000,
		standard: "icrc",
		category: "default",
		decimals: 8,
		name: "Chain key Bitcoin",
		minterCanisterId: "mc6ru-gyaaa-aaaar-qaaaq-cai"
	},
	{
		...ETHEREUM_TOKEN,
		balance: BigNumber.from(10),
		usdBalance: 20000,
	},
	{
		symbol: "ckETH",
		network: ICP_NETWORK,
		balance: BigNumber.from(5),
		usdBalance: 15000,
		standard: "icrc",
		category: "default",
		decimals: 18,
		name: "Chain key Ethereum",
		minterCanisterId: "apia6-jaaaa-aaaar-qabma-cai"
	},
	{
		...ICP_TOKEN,
		balance: BigNumber.from(50),
		usdBalance: 1000,
	}
];

vi.mock('$lib/utils/exchange.utils', () => ({
	usdValue: vi.fn()
}));

describe('getMaxTransactionAmount', () => {
	it('should return the correct maximum amount for a transaction for each token standard', () => {
		tokenStandards.forEach((tokenStandard) => {
			const result = getMaxTransactionAmount({
				balance: BigNumber.from(balance),
				fee: BigNumber.from(fee),
				tokenDecimals,
				tokenStandard
			});
			expect(result).toBe(Number(balance - fee) / 10 ** tokenDecimals);
		});
	});

	it('should return 0 if balance is less than fee', () => {
		tokenStandards.forEach((tokenStandard) => {
			const result = getMaxTransactionAmount({
				fee: BigNumber.from(balance),
				balance: BigNumber.from(fee),
				tokenDecimals,
				tokenStandard
			});
			expect(result).toBe(0);
		});
	});

	it('should return 0 if balance and fee are undefined', () => {
		tokenStandards.forEach((tokenStandard) => {
			const result = getMaxTransactionAmount({
				balance: undefined,
				fee: undefined,
				tokenDecimals,
				tokenStandard
			});
			expect(result).toBe(0);
		});
	});

	it('should handle balance or fee being undefined', () => {
		tokenStandards.forEach((tokenStandard) => {
			let result = getMaxTransactionAmount({
				balance: undefined,
				fee: BigNumber.from(fee),
				tokenDecimals,
				tokenStandard
			});
			expect(result).toBe(0);

			result = getMaxTransactionAmount({
				balance: BigNumber.from(balance),
				fee: undefined,
				tokenDecimals,
				tokenStandard
			});
			expect(result).toBe(Number(balance) / 10 ** tokenDecimals);
		});
	});

	it('should return the untouched amount if the token is ERC20', () => {
		const result = getMaxTransactionAmount({
			balance: BigNumber.from(balance),
			fee: BigNumber.from(fee),
			tokenDecimals: tokenDecimals,
			tokenStandard: 'erc20'
		});
		expect(result).toBe(Number(balance) / 10 ** tokenDecimals);
	});
});

describe('calculateTokenUsdBalance', () => {
	const mockUsdValue = usdValue as MockedFunction<typeof usdValue>;

	beforeEach(() => {
		vi.resetAllMocks();

		mockUsdValue.mockImplementation(
			({ balance, exchangeRate }) => Number(balance ?? 0) * exchangeRate
		);
	});

	it('should correctly calculate USD balance for the token', () => {
		const result = calculateTokenUsdBalance({ token: ETHEREUM_TOKEN, $balances, $exchanges });
		expect(result).toEqual(bn3.toNumber());
	});

	it('should return undefined if exchange rate is not available', () => {
		const result = calculateTokenUsdBalance({ token: ICP_TOKEN, $balances, $exchanges: {} });
		expect(result).toEqual(undefined);
	});

	it('should return 0 if balances store is not available', () => {
		const result = calculateTokenUsdBalance({ token: ETHEREUM_TOKEN, $balances: {}, $exchanges });
		expect(result).toEqual(0);
	});

	it('should return 0 if balances store is undefined', () => {
		const result = calculateTokenUsdBalance({
			token: ETHEREUM_TOKEN,
			$balances: undefined,
			$exchanges
		});
		expect(result).toEqual(0);
	});
});

describe('mapTokenUi', () => {
	const mockUsdValue = usdValue as MockedFunction<typeof usdValue>;

	beforeEach(() => {
		vi.resetAllMocks();

		mockUsdValue.mockImplementation(
			({ balance, exchangeRate }) => Number(balance ?? 0) * exchangeRate
		);
	});

	it('should return an object TokenUi with the correct values', () => {
		const result = mapTokenUi({ token: ETHEREUM_TOKEN, $balances, $exchanges });
		expect(result).toEqual({
			...ETHEREUM_TOKEN,
			balance: bn3,
			usdBalance: bn3.toNumber()
		});
	});

	it('should return an object TokenUi with undefined usdBalance if exchange rate is not available', () => {
		const result = mapTokenUi({ token: ETHEREUM_TOKEN, $balances, $exchanges: {} });
		expect(result).toEqual({
			...ETHEREUM_TOKEN,
			balance: bn3,
			usdBalance: undefined
		});
	});

	it('should return an object TokenUi with undefined balance if balances store is not initiated', () => {
		const result = mapTokenUi({ token: ETHEREUM_TOKEN, $balances: undefined, $exchanges });
		expect(result).toEqual({
			...ETHEREUM_TOKEN,
			balance: undefined,
			usdBalance: 0
		});
	});

	it('should return an object TokenUi with undefined balance if balances store is not available', () => {
		const result = mapTokenUi({ token: ETHEREUM_TOKEN, $balances: {}, $exchanges });
		expect(result).toEqual({
			...ETHEREUM_TOKEN,
			balance: undefined,
			usdBalance: 0
		});
	});

	it('should return an object TokenUi with null balance if balances data is null', () => {
		const result = mapTokenUi({
			token: ETHEREUM_TOKEN,
			$balances: { [ETHEREUM_TOKEN.id]: null },
			$exchanges
		});
		expect(result).toEqual({
			...ETHEREUM_TOKEN,
			balance: null,
			usdBalance: 0
		});
	});

	it("should group tokens with matching twinTokenSymbol", () => {
		const groupedTokens = groupTokensByTwin(tokens as TokenUi[]);
		expect(groupedTokens).toHaveLength(3);

		const btcGroup = groupedTokens[0];
		expect(btcGroup).toHaveProperty("header");
		expect(btcGroup).toHaveProperty("tokens");
		expect((btcGroup as TokenGroupUi).tokens).toHaveLength(2);
		expect((btcGroup as TokenGroupUi).tokens.map(t => t.symbol)).toContain("BTC");
		expect((btcGroup as TokenGroupUi).tokens.map(t => t.symbol)).toContain("ckBTC");

		const icpToken = groupedTokens[2];
		expect(icpToken).toHaveProperty("symbol", "ICP");
	});

	it("should handle tokens without twinTokenSymbol", () => {

		const tokensWithoutTwins = [ICP_TOKEN];
		const groupedTokens = groupTokensByTwin(tokensWithoutTwins);

		expect(groupedTokens).toHaveLength(1);
		expect(groupedTokens[0]).toHaveProperty("symbol", "ICP");
	});

	it("should place the group in the position of the first token", () => {
		const groupedTokens = groupTokensByTwin(tokens as TokenUi[]);
		const firstGroup = groupedTokens[0];
		expect(firstGroup).toHaveProperty("tokens");
		expect((firstGroup as TokenGroupUi).tokens.map(t => t.symbol)).toContain("BTC");
		expect((firstGroup as TokenGroupUi).tokens.map(t => t.symbol)).toContain("ckBTC");
	});

	it("should not duplicate tokens in the result", () => {
		const groupedTokens = groupTokensByTwin(tokens as TokenUi[]);

		const tokenSymbols = groupedTokens.flatMap(groupOrToken => 'tokens' in groupOrToken ? groupOrToken.tokens.map(t => t.symbol) : [groupOrToken.symbol]);
		const uniqueSymbols = new Set(tokenSymbols);
		expect(uniqueSymbols.size).toBe(tokenSymbols.length);
	});
});
