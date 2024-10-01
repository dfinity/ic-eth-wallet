use candid::Principal;
use ic_cdk::api::management_canister::bitcoin::Utxo;
use std::collections::HashMap;

#[allow(dead_code)]
const MAX_PENDING_TRANSACTIONS: usize = 1000;
#[allow(dead_code)]
const DAY_IN_NS: u64 = 24 * 60 * 60 * 1_000_000_000;

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct StoredPendingTransaction {
    txid: Vec<u8>,
    utxos: Vec<Utxo>,
    created_at_timestamp_ns: u64,
}

type BitcoinAddress = String;
type PendingTransactionsMap = HashMap<BitcoinAddress, Vec<StoredPendingTransaction>>;

#[allow(dead_code)]
pub struct BtcUserPendingTransactions {
    /// Map of `user_principal` to `PendingTransactionsMap`;
    pending_transactions_map: HashMap<Principal, PendingTransactionsMap>,
    /// Maximum number of transactions stored per principal.
    max_pending_transactions: usize,
}

impl BtcUserPendingTransactions {
    #[allow(dead_code)]
    pub fn new(max_pending_txs: Option<usize>) -> Self {
        Self {
            pending_transactions_map: HashMap::new(),
            max_pending_transactions: max_pending_txs.unwrap_or(MAX_PENDING_TRANSACTIONS),
        }
    }

    /// Returns the pending transactions of a specific principal.
    #[allow(dead_code)]
    pub fn get_pending_transactions(
        &self,
        principal: &Principal,
        address: String,
    ) -> &Vec<StoredPendingTransaction> {
        static EMPTY_VEC: Vec<StoredPendingTransaction> = Vec::new();
        self.pending_transactions_map
            .get(principal)
            .map(|map| map.get(&address).unwrap_or(&EMPTY_VEC))
            .unwrap_or(&EMPTY_VEC)
    }

    /// Adds a pending transaction for a specific principal.
    /// It has a limit of storable transactions set on init.
    #[allow(dead_code)]
    pub fn add_pending_transaction(
        &mut self,
        principal: Principal,
        address: String,
        new_transaction: StoredPendingTransaction,
    ) -> Result<(), String> {
        if let Some(address_map) = self.pending_transactions_map.get_mut(&principal) {
            if let Some(list) = address_map.get_mut(&address) {
                if list.len() >= self.max_pending_transactions {
                    return Err("Maximum pending transactions reached".to_string());
                }
                list.push(new_transaction);
            } else {
                let list: Vec<StoredPendingTransaction> = vec![new_transaction];
                address_map.insert(address, list);
            }
        } else {
            let mut address_map: PendingTransactionsMap = HashMap::new();
            let list: Vec<StoredPendingTransaction> = vec![new_transaction];
            address_map.insert(address, list);
            self.pending_transactions_map.insert(principal, address_map);
        }
        Ok(())
    }

    /// Prunes pending transactions for a specific principal.
    /// A pending transaction can be pruned for two reasons:
    /// - Transaction is older than 1 day.
    ///   We consider that if a pending transaction is older than one day
    ///   it means it failed and we can free to utxos to be used again.
    /// - None of the transaction's utxos are present in the current utxos list.
    ///   We use the pending transactions to avoid double spending.
    ///   Once we know that a utxos is not available, we can remove the pending transaction.
    ///   Normally, all utxos of a pending transaction should be present or not.
    ///   Partial presence could happen if the utxos of a pending transaction were not really used in the transaction.
    ///   We don't remove in partial presence because, in the end, partial presence will be temporary for one day.
    #[allow(dead_code)]
    pub fn prune_pending_transactions(
        &mut self,
        principal: Principal,
        current_utxos: &[Utxo],
        now_ns: u64,
    ) {
        if let Some(address_map) = self.pending_transactions_map.get_mut(&principal) {
            for (_, transactions) in address_map.into_iter() {
                let pruned_list: Vec<StoredPendingTransaction> = transactions
                    .clone()
                    .into_iter()
                    .filter(|pending_transaction| {
                        let is_old =
                            pending_transaction.created_at_timestamp_ns + DAY_IN_NS < now_ns;
                        let all_utxos_found = pending_transaction
                            .utxos
                            .iter()
                            .all(|utxo| !current_utxos.contains(utxo));
                        !is_old && !all_utxos_found
                    })
                    .collect();
                *transactions = pruned_list;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ic_cdk::api::management_canister::bitcoin::Outpoint;

    const UTXO_1: Utxo = Utxo {
        outpoint: Outpoint {
            txid: vec![],
            vout: 0,
        },
        value: 1000,
        height: 100,
    };
    const UTXO_2: Utxo = Utxo {
        outpoint: Outpoint {
            txid: vec![],
            vout: 1,
        },
        value: 2000,
        height: 120,
    };
    const UTXO_3: Utxo = Utxo {
        outpoint: Outpoint {
            txid: vec![],
            vout: 2,
        },
        value: 3000,
        height: 150,
    };
    const UTXO_4: Utxo = Utxo {
        outpoint: Outpoint {
            txid: vec![],
            vout: 2,
        },
        value: 8000,
        height: 160,
    };

    const PRINCIPAL_TEXT_1: &str =
        "7blps-itamd-lzszp-7lbda-4nngn-fev5u-2jvpn-6y3ap-eunp7-kz57e-fqe";
    const PRINCIPAL_TEXT_2: &str =
        "xzg7k-thc6c-idntg-knmtz-2fbhh-utt3e-snqw6-5xph3-54pbp-7axl5-tae";
    const address1: &str = "test-address-1";
    const address2: &str = "test-address-2";

    #[test]
    fn test_get_pending_transactions_empty() {
        let btc_user_pending_transactions = BtcUserPendingTransactions::new(None);
        let principal = Principal::from_text(PRINCIPAL_TEXT_1).unwrap();

        let pending_txs = btc_user_pending_transactions
            .get_pending_transactions(&principal, address1.to_string());
        assert!(pending_txs.is_empty());
    }

    #[test]
    fn test_add_pending_transaction_per_address() {
        let mut btc_user_pending_transactions = BtcUserPendingTransactions::new(None);
        let principal = Principal::from_text(PRINCIPAL_TEXT_1).unwrap();
        let tx = StoredPendingTransaction {
            txid: vec![],
            utxos: vec![UTXO_1],
            created_at_timestamp_ns: 1_000_000,
        };

        // Add the pending transaction
        let result = btc_user_pending_transactions.add_pending_transaction(
            principal.clone(),
            address1.to_string(),
            tx.clone(),
        );
        assert!(result.is_ok());

        // Check that the transaction was added
        let pending_txs = btc_user_pending_transactions
            .get_pending_transactions(&principal, address1.to_string());
        assert_eq!(pending_txs.len(), 1);
        assert_eq!(pending_txs[0], tx);

        // Check that the transaction was added to the proper address
        let pending_txs = btc_user_pending_transactions
            .get_pending_transactions(&principal, address2.to_string());
        assert!(pending_txs.is_empty());
    }

    #[test]
    fn test_add_pending_transaction_does_not_add_other_principal() {
        let mut btc_user_pending_transactions = BtcUserPendingTransactions::new(None);
        let principal1 = Principal::from_text(PRINCIPAL_TEXT_1).unwrap();
        let principal2 = Principal::from_text(PRINCIPAL_TEXT_2).unwrap();
        let tx = StoredPendingTransaction {
            txid: vec![],
            utxos: vec![UTXO_1],
            created_at_timestamp_ns: 1_000_000,
        };

        let result = btc_user_pending_transactions.add_pending_transaction(
            principal1.clone(),
            address1.to_string(),
            tx.clone(),
        );
        assert!(result.is_ok());

        let pending_txs = btc_user_pending_transactions
            .get_pending_transactions(&principal2, address1.to_string());
        assert!(pending_txs.is_empty());
    }

    // Test for add_pending_transaction when MAX_PENDING_TRANSACTIONS is reached
    #[test]
    fn test_add_pending_transaction_max_limit() {
        let mut btc_user_pending_transactions = BtcUserPendingTransactions::new(Some(3));
        let principal = Principal::from_text(PRINCIPAL_TEXT_1).unwrap();

        let tx1 = StoredPendingTransaction {
            txid: vec![1, 2, 3],
            utxos: vec![UTXO_1],
            created_at_timestamp_ns: 1_000_000,
        };
        let tx2 = StoredPendingTransaction {
            txid: vec![4, 5, 6],
            utxos: vec![UTXO_2],
            created_at_timestamp_ns: 2_000_000,
        };
        let tx3 = StoredPendingTransaction {
            txid: vec![7, 8, 9],
            utxos: vec![UTXO_3],
            created_at_timestamp_ns: 3_000_000,
        };
        let tx4 = StoredPendingTransaction {
            txid: vec![10, 11, 12],
            utxos: vec![UTXO_4],
            created_at_timestamp_ns: 4_000_000,
        };

        // Add 3 transactions (MAX_PENDING_TRANSACTIONS = 3)
        btc_user_pending_transactions
            .add_pending_transaction(principal.clone(), address1.to_string(), tx1)
            .unwrap();
        btc_user_pending_transactions
            .add_pending_transaction(principal.clone(), address1.to_string(), tx2)
            .unwrap();
        btc_user_pending_transactions
            .add_pending_transaction(principal.clone(), address1.to_string(), tx3)
            .unwrap();

        // Try adding a 4th transaction and expect an error
        let result = btc_user_pending_transactions.add_pending_transaction(
            principal.clone(),
            address1.to_string(),
            tx4,
        );
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Maximum pending transactions reached");
    }

    #[test]
    fn test_prune_old_pending_transactions() {
        let mut btc_user_pending_transactions = BtcUserPendingTransactions::new(None);
        let principal = Principal::from_text(PRINCIPAL_TEXT_1).unwrap();

        let yesterday_ns = 1_000_000;
        let now_ns = yesterday_ns + DAY_IN_NS;

        let old_transaction = StoredPendingTransaction {
            txid: vec![1, 2, 3],
            utxos: vec![UTXO_1],
            created_at_timestamp_ns: yesterday_ns,
        };
        btc_user_pending_transactions
            .add_pending_transaction(
                principal.clone(),
                address1.to_string(),
                old_transaction.clone(),
            )
            .unwrap();

        let valid_transaction = StoredPendingTransaction {
            txid: vec![4, 5, 6],
            utxos: vec![UTXO_2],
            created_at_timestamp_ns: now_ns,
        };
        btc_user_pending_transactions
            .add_pending_transaction(
                principal.clone(),
                address1.to_string(),
                valid_transaction.clone(),
            )
            .unwrap();

        let pending_txs = btc_user_pending_transactions
            .get_pending_transactions(&principal, address1.to_string());
        assert_eq!(pending_txs.len(), 2);

        let all_utxos = &[UTXO_1, UTXO_2];

        btc_user_pending_transactions.prune_pending_transactions(
            principal.clone(),
            all_utxos,
            now_ns + 1,
        );

        let pending_txs = btc_user_pending_transactions
            .get_pending_transactions(&principal, address1.to_string());
        assert_eq!(pending_txs.len(), 1);
        assert_eq!(pending_txs[0], valid_transaction);
    }

    #[test]
    fn test_prune_with_available_utxos() {
        let mut btc_user_pending_transactions = BtcUserPendingTransactions::new(None);
        let principal = Principal::from_text(PRINCIPAL_TEXT_1).unwrap();

        let now_ns = 1_000_000_000_000;

        let transaction_1 = StoredPendingTransaction {
            txid: vec![1, 2, 3],
            utxos: vec![UTXO_1],
            created_at_timestamp_ns: now_ns,
        };
        let transaction_2 = StoredPendingTransaction {
            txid: vec![4, 5, 6],
            utxos: vec![UTXO_2],
            created_at_timestamp_ns: now_ns,
        };

        btc_user_pending_transactions
            .add_pending_transaction(
                principal.clone(),
                address1.to_string(),
                transaction_1.clone(),
            )
            .unwrap();
        btc_user_pending_transactions
            .add_pending_transaction(
                principal.clone(),
                address1.to_string(),
                transaction_2.clone(),
            )
            .unwrap();

        let pending_txs = btc_user_pending_transactions
            .get_pending_transactions(&principal, address1.to_string());
        assert_eq!(pending_txs.len(), 2);

        let available_utxos = &[UTXO_1];
        btc_user_pending_transactions.prune_pending_transactions(
            principal.clone(),
            available_utxos,
            now_ns,
        );

        let pending_txs = btc_user_pending_transactions
            .get_pending_transactions(&principal, address1.to_string());
        assert_eq!(pending_txs.len(), 1);
        assert_eq!(pending_txs[0], transaction_1);
    }

    #[test]
    fn test_does_not_prune_with_partial_available_utxos() {
        let mut btc_user_pending_transactions = BtcUserPendingTransactions::new(None);
        let principal = Principal::from_text(PRINCIPAL_TEXT_1).unwrap();

        let now_ns = 1_000_000_000_000;

        let transaction_1 = StoredPendingTransaction {
            txid: vec![1, 2, 3],
            utxos: vec![UTXO_1],
            created_at_timestamp_ns: now_ns,
        };
        let transaction_2 = StoredPendingTransaction {
            txid: vec![4, 5, 6],
            utxos: vec![UTXO_2, UTXO_3],
            created_at_timestamp_ns: now_ns,
        };

        btc_user_pending_transactions
            .add_pending_transaction(
                principal.clone(),
                address1.to_string(),
                transaction_1.clone(),
            )
            .unwrap();
        btc_user_pending_transactions
            .add_pending_transaction(
                principal.clone(),
                address1.to_string(),
                transaction_2.clone(),
            )
            .unwrap();

        let pending_txs = btc_user_pending_transactions
            .get_pending_transactions(&principal, address1.to_string());
        assert_eq!(pending_txs.len(), 2);

        let available_utxos = &[UTXO_1, UTXO_3];
        btc_user_pending_transactions.prune_pending_transactions(
            principal.clone(),
            available_utxos,
            now_ns,
        );

        let pending_txs = btc_user_pending_transactions
            .get_pending_transactions(&principal, address1.to_string());
        assert_eq!(pending_txs.len(), 2);
    }
}
