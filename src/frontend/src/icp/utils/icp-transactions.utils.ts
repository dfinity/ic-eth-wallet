import type { IcpTransaction, IcTransactionAddOnsInfo, IcTransactionUi } from '$icp/types/ic';
import { getAccountIdentifier } from '$icp/utils/icp-account.utils';
import { ICP_EXPLORER_URL } from '$lib/constants/explorers.constants';
import type { OptionIdentity } from '$lib/types/identity';
import type { Tokens, Transaction, TransactionWithId } from '@dfinity/ledger-icp';
import { fromNullable, nonNullish } from '@dfinity/utils';

export const mapTransactionIcpToSelf = (
	tx: TransactionWithId
): ({ transaction: Transaction & IcTransactionAddOnsInfo } & Pick<TransactionWithId, 'id'>)[] => {
	const { transaction, id } = tx;
	const { operation } = transaction;

	if (!('Transfer' in operation)) {
		return [
			{
				id,
				transaction
			}
		];
	}

	const {
		Transfer: { from, to }
	} = operation;

	return [
		{
			id,
			transaction: {
				...transaction,
				transferToSelf: 'send'
			}
		},
		...(from.toLowerCase() === to.toLowerCase()
			? [
					{
						id,
						transaction: {
							...transaction,
							transferToSelf: 'receive' as const
						}
					}
				]
			: [])
	];
};
export const mapIcpTransaction = ({
	transaction: { transaction, id },
	identity
}: {
	transaction: IcpTransaction;
	identity: OptionIdentity;
}): IcTransactionUi => {
	const { operation, created_at_time, transferToSelf } = transaction;

	const tx: Pick<IcTransactionUi, 'timestamp' | 'id' | 'status' | 'txExplorerUrl'> = {
		id,
		timestamp: fromNullable(created_at_time)?.timestamp_nanos,
		status: 'executed',
		...(nonNullish(ICP_EXPLORER_URL) && { txExplorerUrl: `${ICP_EXPLORER_URL}/transaction/${id}` })
	};

	const accountIdentifier = nonNullish(identity)
		? getAccountIdentifier(identity.getPrincipal())
		: undefined;

	const mapFrom = (
		from: string
	): Pick<IcTransactionUi, 'from' | 'fromExplorerUrl' | 'incoming'> => ({
		from,
		...(nonNullish(ICP_EXPLORER_URL) && { fromExplorerUrl: `${ICP_EXPLORER_URL}/account/${from}` }),
		incoming:
			from?.toLowerCase() !== accountIdentifier?.toHex().toLowerCase() ||
			transferToSelf === 'receive'
	});

	const mapTo = (to: string): Pick<IcTransactionUi, 'to' | 'toExplorerUrl'> => ({
		to,
		...(nonNullish(ICP_EXPLORER_URL) && { toExplorerUrl: `${ICP_EXPLORER_URL}/account/${to}` })
	});

	const mapAmount = ({
		amount,
		fee,
		incoming
	}: {
		incoming: boolean | undefined;
		fee: Tokens;
		amount: Tokens;
	}): bigint => amount.e8s + (incoming === false ? fee.e8s : 0n);

	if ('Approve' in operation) {
		return {
			...tx,
			type: 'approve',
			...mapFrom(operation.Approve.from)
		};
	}

	if ('Burn' in operation) {
		return {
			...tx,
			type: 'burn',
			...mapFrom(operation.Burn.from),
			value: operation.Burn.amount.e8s
		};
	}

	if ('Mint' in operation) {
		return {
			...tx,
			type: 'mint',
			...mapTo(operation.Mint.to),
			incoming: true,
			value: operation.Mint.amount.e8s
		};
	}

	if ('Transfer' in operation) {
		const source = mapFrom(operation.Transfer.from);

		return {
			...tx,
			type: source.incoming === false ? 'send' : 'receive',
			...source,
			...mapTo(operation.Transfer.to),
			value: mapAmount({
				amount: operation.Transfer.amount,
				fee: operation.Transfer.fee,
				incoming: source.incoming
			})
		};
	}

	throw new Error(`Unknown transaction type ${JSON.stringify(transaction)}`);
};
