import type { _SERVICE as SignerService, SignRequest } from '$declarations/signer/signer.did';
import { SignerCanister } from '$lib/canisters/signer.canister';
import { CanisterPaymentError, InternalError } from '$lib/canisters/signer.errors';
import type { CreateCanisterOptions } from '$lib/types/canister';
import { type ActorSubclass } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { mock } from 'vitest-mock-extended';
import { mockIdentity } from '../../mocks/identity.mock';

vi.mock(import('$lib/constants/app.constants'), async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		LOCAL: false
	};
});

describe('signer.canister', () => {
	const createSignerCanister = async ({
		serviceOverride
	}: Pick<CreateCanisterOptions<SignerService>, 'serviceOverride'>): Promise<SignerCanister> =>
		SignerCanister.create({
			canisterId: Principal.fromText('tdxud-2yaaa-aaaad-aadiq-cai'),
			identity: mockIdentity,
			certifiedServiceOverride: serviceOverride,
			serviceOverride
		});
	const service = mock<ActorSubclass<SignerService>>();
	const mockResponseError = new Error('Test response error');
	const btcParams = {
		network: { mainnet: null }
	};
	const signTransactionParams = {
		transaction: {
			to: 'to',
			gas: 1n,
			value: 2n,
			max_priority_fee_per_gas: 1n,
			data: [],
			max_fee_per_gas: 5n,
			chain_id: 10n,
			nonce: 10n
		} as SignRequest
	};
	const personalSignParams = {
		message: 'message'
	};
	const signPrehashParams = {
		hash: 'hash'
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns correct BTC address', async () => {
		const address = 'test-bitcoin-address';
		const response = { Ok: { address } };
		service.btc_caller_address.mockResolvedValue(response);

		const { getBtcAddress } = await createSignerCanister({
			serviceOverride: service
		});

		const res = await getBtcAddress(btcParams);

		expect(res).toEqual(address);
		expect(service.btc_caller_address).toHaveBeenCalledWith(
			{ network: btcParams.network, address_type: { P2WPKH: null } },
			[]
		);
	});

	it('should throw an error if btc_caller_address returns an internal error', async () => {
		const response = { Err: { InternalError: { msg: 'Test error' } } };
		service.btc_caller_address.mockResolvedValue(response);

		const { getBtcAddress } = await createSignerCanister({
			serviceOverride: service
		});

		const res = getBtcAddress(btcParams);

		await expect(res).rejects.toThrow(new InternalError(response.Err.InternalError.msg));
	});

	it('should throw an error if btc_caller_address returns a payment error', async () => {
		const response = { Err: { PaymentError: { UnsupportedPaymentType: null } } };
		service.btc_caller_address.mockResolvedValue(response);

		const { getBtcAddress } = await createSignerCanister({
			serviceOverride: service
		});

		const res = getBtcAddress(btcParams);

		await expect(res).rejects.toThrow(new CanisterPaymentError(response.Err.PaymentError));
	});

	it('should throw an error if btc_caller_address throws', async () => {
		service.btc_caller_address.mockImplementation(async () => {
			throw mockResponseError;
		});

		const { getBtcAddress } = await createSignerCanister({
			serviceOverride: service
		});

		const res = getBtcAddress(btcParams);

		await expect(res).rejects.toThrow(mockResponseError);
	});

	it('returns correct BTC balance', async () => {
		const balance = 2n;
		const response = { Ok: { balance } };
		service.btc_caller_balance.mockResolvedValue(response);

		const { getBtcBalance } = await createSignerCanister({
			serviceOverride: service
		});

		const res = await getBtcBalance(btcParams);

		expect(res).toEqual(balance);
		expect(service.btc_caller_balance).toHaveBeenCalledWith(
			{ network: btcParams.network, address_type: { P2WPKH: null } },
			[]
		);
	});

	it('should throw an error if btc_caller_balance returns an internal error', async () => {
		const response = { Err: { InternalError: { msg: 'Test error' } } };
		service.btc_caller_balance.mockResolvedValue(response);

		const { getBtcBalance } = await createSignerCanister({
			serviceOverride: service
		});

		const res = getBtcBalance(btcParams);

		await expect(res).rejects.toThrow(new InternalError(response.Err.InternalError.msg));
	});

	it('should throw an error if btc_caller_balance returns a payment error', async () => {
		const response = { Err: { PaymentError: { UnsupportedPaymentType: null } } };
		service.btc_caller_balance.mockResolvedValue(response);

		const { getBtcBalance } = await createSignerCanister({
			serviceOverride: service
		});

		const res = getBtcBalance(btcParams);

		await expect(res).rejects.toThrow(new CanisterPaymentError(response.Err.PaymentError));
	});

	it('should throw an error if btc_caller_balance throws', async () => {
		service.btc_caller_balance.mockImplementation(async () => {
			throw mockResponseError;
		});

		const { getBtcBalance } = await createSignerCanister({
			serviceOverride: service
		});

		const res = getBtcBalance(btcParams);

		await expect(res).rejects.toThrow(mockResponseError);
	});

	it('returns correct ETH address', async () => {
		const response = 'test-eth-address';
		service.caller_eth_address.mockResolvedValue(response);

		const { getEthAddress } = await createSignerCanister({
			serviceOverride: service
		});

		const res = await getEthAddress();

		expect(res).toEqual(response);
	});

	it('should throw an error if caller_eth_address throws', async () => {
		service.caller_eth_address.mockImplementation(async () => {
			throw mockResponseError;
		});

		const { getEthAddress } = await createSignerCanister({
			serviceOverride: service
		});

		const res = getEthAddress();

		await expect(res).rejects.toThrow(mockResponseError);
	});

	it('signs transaction', async () => {
		const response = 'signed-transaction';
		service.sign_transaction.mockResolvedValue(response);

		const { signTransaction } = await createSignerCanister({
			serviceOverride: service
		});

		const res = await signTransaction(signTransactionParams);

		expect(res).toEqual(response);
		expect(service.sign_transaction).toHaveBeenCalledWith(signTransactionParams.transaction);
	});

	it('should throw an error if sign_transaction throws', async () => {
		service.sign_transaction.mockImplementation(async () => {
			throw mockResponseError;
		});

		const { signTransaction } = await createSignerCanister({
			serviceOverride: service
		});

		const res = signTransaction(signTransactionParams);

		await expect(res).rejects.toThrow(mockResponseError);
	});

	it('calls personal sign', async () => {
		const response = 'personal-sign';
		service.personal_sign.mockResolvedValue(response);

		const { personalSign } = await createSignerCanister({
			serviceOverride: service
		});

		const res = await personalSign(personalSignParams);

		expect(res).toEqual(response);
		expect(service.personal_sign).toHaveBeenCalledWith(personalSignParams.message);
	});

	it('should throw an error if personal_sign throws', async () => {
		service.personal_sign.mockImplementation(async () => {
			throw mockResponseError;
		});

		const { personalSign } = await createSignerCanister({
			serviceOverride: service
		});

		const res = personalSign(personalSignParams);

		await expect(res).rejects.toThrow(mockResponseError);
	});

	it('signs prehash', async () => {
		const response = 'personal-sign';
		service.sign_prehash.mockResolvedValue(response);

		const { signPrehash } = await createSignerCanister({
			serviceOverride: service
		});

		const res = await signPrehash(signPrehashParams);

		expect(res).toEqual(response);
		expect(service.sign_prehash).toHaveBeenCalledWith(signPrehashParams.hash);
	});

	it('should throw an error if sign_prehash throws', async () => {
		service.sign_prehash.mockImplementation(async () => {
			throw mockResponseError;
		});

		const { signPrehash } = await createSignerCanister({
			serviceOverride: service
		});

		const res = signPrehash(signPrehashParams);

		await expect(res).rejects.toThrow(mockResponseError);
	});
});
