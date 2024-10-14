/**
 * Auto-generated definitions file ("npm run i18n")
 */

interface I18nCore {
	text: {
		cancel: string;
		next: string;
		save: string;
		back: string;
		done: string;
		close: string;
		refresh: string;
		name: string;
		symbol: string;
		decimals: string;
		amount: string;
		max: string;
		more: string;
		reject: string;
		approve: string;
	};
	info: { test_banner: string };
	alt: { logo: string; go_to_home: string };
	warning: { may_take_a_few_seconds: string; do_not_close: string };
}

interface I18nNavigation {
	text: {
		tokens: string;
		settings: string;
		source_code_on_github: string;
		view_on_explorer: string;
		source_code: string;
		changelog: string;
		submit_ticket: string;
		dapps: string;
	};
	alt: {
		tokens: string;
		settings: string;
		more_settings: string;
		menu: string;
		changelog: string;
		submit_ticket: string;
		open_twitter: string;
		dapps: string;
	};
}

interface I18nAuth {
	text: {
		title_part_1: string;
		title_part_2: string;
		logout: string;
		authenticate: string;
		safe_access: string;
		privacy_and_security: string;
		powered_by_chain_fusion: string;
	};
	alt: { sign_in: string; preview: string };
	warning: { not_signed_in: string; session_expired: string };
	error: {
		no_internet_identity: string;
		invalid_pouh_credential: string;
		error_validating_pouh_credential_oisy: string;
		error_validating_pouh_credential: string;
		error_requesting_pouh_credential: string;
		missing_pouh_issuer_origin: string;
		no_pouh_credential: string;
		error_while_signing_in: string;
		unexpected_issue_with_syncing: string;
	};
}

interface I18nFooter {
	text: { copyright: string; developed_with: string; dfinity: string };
	alt: { dfinity: string };
}

interface I18nWallet {
	text: {
		address: string;
		wallet_address: string;
		your_addresses: string;
		address_copied: string;
		wallet_address_copied: string;
		display_wallet_address_qr: string;
		icp_deposits: string;
		use_address_from_to: string;
	};
	alt: { open_etherscan: string };
}

interface I18nInit {
	text: { initializing_wallet: string; securing_session: string; retrieving_public_keys: string };
	info: { hold_loading: string; hold_loading_wallet: string };
	error: {
		no_alchemy_config: string;
		no_alchemy_provider: string;
		no_alchemy_erc20_provider: string;
		no_etherscan_provider: string;
		no_etherscan_rest_api: string;
		no_infura_provider: string;
		no_infura_cketh_provider: string;
		no_infura_ckerc20_provider: string;
		no_infura_erc20_provider: string;
		no_infura_erc20_icp_provider: string;
		eth_address_unknown: string;
		loading_address: string;
		loading_balance: string;
		loading_balance_symbol: string;
		erc20_contracts: string;
		minter_ckbtc_btc: string;
		minter_cketh_eth: string;
		minter_ckerc20_erc20: string;
		ledger_cketh_eth: string;
		minter_btc: string;
		minter_ckbtc_info: string;
		minter_cketh_info: string;
		minter_ckbtc_loading_info: string;
		minter_cketh_loading_info: string;
		btc_fees_estimation: string;
		btc_withdrawal_statuses: string;
		transaction_price: string;
		icrc_canisters: string;
		erc20_user_tokens: string;
		erc20_user_token: string;
		icrc_custom_token: string;
		loading_wallet_timeout: string;
		allow_signing: string;
	};
}

interface I18nHero {
	text: { available_balance: string; use_with_caution: string; learn_more_about_erc20_icp: string };
}

interface I18nSettings {
	text: {
		title: string;
		principal: string;
		principal_copied: string;
		principal_description: string;
		session: string;
		session_description: string;
		testnets: string;
		testnets_description: string;
		hide_zero_balances_description: string;
		credentials_title: string;
		pouh_credential: string;
		pouh_credential_description: string;
		present_pouh_credential: string;
		pouh_credential_verified: string;
		sign_in: string;
	};
	alt: { testnets_toggle: string; github_release: string };
	error: { loading_profile: string };
}

interface I18nDApps {
	text: {
		about: string;
		sub_headline: string;
		title: string;
		headline: string;
		launch: string;
		submit: string;
		official_channels: string;
	};
}

interface I18nNetworks {
	title: string;
	show_testnets: string;
	more: string;
	chain_fusion: string;
}

interface I18nReceive {
	text: { receive: string; address: string };
	icp: {
		text: {
			account_id: string;
			use_for_all_tokens: string;
			use_for_icrc_deposit: string;
			use_for_icp_deposit: string;
			display_account_id_qr: string;
			account_id_copied: string;
			principal: string;
			internet_computer_principal_copied: string;
			display_internet_computer_principal_qr: string;
			icp_account: string;
			icp_account_copied: string;
			display_icp_account_qr: string;
		};
	};
	ethereum: {
		text: {
			checking_status: string;
			from_network: string;
			eth_to_cketh_description: string;
			learn_how_to_convert: string;
			metamask: string;
			ethereum: string;
			ethereum_address: string;
			ethereum_address_copied: string;
			display_ethereum_address_qr: string;
		};
		error: { no_metamask: string };
	};
	bitcoin: {
		text: {
			bitcoin: string;
			checking_status: string;
			refresh_status: string;
			initializing: string;
			checking_incoming: string;
			refreshing_wallet: string;
			bitcoin_address: string;
			bitcoin_testnet_address: string;
			bitcoin_regtest_address: string;
			display_bitcoin_address_qr: string;
			bitcoin_address_copied: string;
			from_network: string;
			fee_applied: string;
		};
		info: { no_new_btc: string; check_btc_progress: string };
		error: { unexpected_btc: string };
	};
}

interface I18nSend {
	text: {
		send: string;
		destination: string;
		source: string;
		balance: string;
		review: string;
		signing_approval: string;
		approving: string;
		approving_fees: string;
		approving_transfer: string;
		approving_wallet_connect: string;
		refreshing_ui: string;
		initializing: string;
		signing_transaction: string;
		sending: string;
		signing: string;
		signing_message: string;
		network: string;
		source_network: string;
		destination_network: string;
		initializing_transaction: string;
		convert_to_native_icp: string;
		open_qr_modal: string;
		scan_qr: string;
	};
	placeholder: {
		enter_eth_address: string;
		enter_recipient_address: string;
		enter_wallet_address: string;
		select_network: string;
	};
	info: { ckbtc_certified: string; cketh_certified: string; pending_bitcoin_transaction: string };
	assertion: {
		invalid_destination_address: string;
		insufficient_funds: string;
		unknown_minimum_ckbtc_amount: string;
		unknown_minimum_cketh_amount: string;
		minimum_ckbtc_amount: string;
		minimum_cketh_amount: string;
		minimum_ledger_fees: string;
		minimum_cketh_balance: string;
		unknown_cketh: string;
		destination_address_invalid: string;
		amount_invalid: string;
		insufficient_funds_for_gas: string;
		insufficient_funds_for_amount: string;
		insufficient_ethereum_funds_to_cover_the_fees: string;
		not_enough_tokens_for_gas: string;
		gas_fees_not_defined: string;
		max_gas_fee_per_gas_undefined: string;
		address_unknown: string;
		minter_info_not_loaded: string;
		minter_info_not_certified: string;
		cketh_max_transaction_fee_missing: string;
		utxos_fee_missing: string;
	};
	error: {
		unexpected: string;
		destination_address_unknown: string;
		metamask_connected: string;
		metamask_no_accounts: string;
		metamask_switch_network: string;
		erc20_data_undefined: string;
		data_undefined: string;
		no_identity_calculate_fee: string;
		invalid_destination: string;
		incompatible_token: string;
		no_btc_network_id: string;
		no_pending_bitcoin_transaction: string;
		unexpected_utxos_fee: string;
	};
}

interface I18nConvert {
	text: {
		converting: string;
		convert_to_btc: string;
		convert_to_token: string;
		convert_to_cketh: string;
		convert_to_ckerc20: string;
		convert_eth_to_cketh: string;
		cketh_conversions_may_take: string;
		ckerc20_conversions_may_take: string;
		how_to_convert_eth_to_cketh: string;
		send_eth: string;
		wait_eth_current_balance: string;
		set_amount: string;
		check_balance_for_fees: string;
		fees_explanation: string;
		current_balance: string;
	};
	error: { loading_cketh_helper: string };
}

interface I18nBuy {
	text: { buy: string; buy_dev: string };
	onramper: { title: string };
}

interface I18nTokens {
	text: {
		contract_address: string;
		balance: string;
		hide_zero_balances: string;
		hide_zeros: string;
		all_tokens_with_zero_hidden: string;
		initializing: string;
		updating_ui: string;
		show_token: string;
		hide_token: string;
	};
	details: {
		title: string;
		token: string;
		network: string;
		contract_address_copied: string;
		twin_token: string;
		standard: string;
	};
	import: {
		text: {
			title: string;
			review: string;
			saving: string;
			ledger_canister_id: string;
			index_canister_id: string;
			minter_canister_id: string;
			ledger_canister_id_copied: string;
			index_canister_id_copied: string;
			minter_canister_id_copied: string;
			verifying: string;
			add_the_token: string;
			info: string;
			github_howto: string;
			open_github_howto: string;
		};
		error: {
			loading_metadata: string;
			no_metadata: string;
			unexpected_index: string;
			unexpected_index_ledger: string;
			invalid_ledger_id: string;
			missing_ledger_id: string;
			missing_index_id: string;
			missing_contract_address: string;
			no_network: string;
		};
	};
	manage: {
		text: {
			title: string;
			manage_list: string;
			do_not_see_import: string;
			clear_filter: string;
			manage_for_network: string;
			network: string;
			all_tokens_zero_balance: string;
		};
		placeholder: { select_network: string };
		info: { outdated_index_canister: string; no_changes: string };
		error: { unexpected_build: string; empty: string };
	};
	hide: { title: string; token: string; info: string; confirm: string; hiding: string };
	alt: {
		context_menu: string;
		open_etherscan: string;
		open_dashboard: string;
		open_contract_address_block_explorer: string;
	};
	placeholder: { enter_contract_address: string; search_token: string };
	warning: { trust_token: string };
	error: {
		invalid_contract_address: string;
		invalid_ledger: string;
		invalid_index: string;
		no_metadata: string;
		unexpected: string;
		unexpected_hiding: string;
		already_available: string;
		loading_metadata: string;
		not_toggleable: string;
		incomplete_metadata: string;
		duplicate_metadata: string;
		unexpected_undefined: string;
	};
}

interface I18nFee {
	text: {
		fee: string;
		estimated_btc: string;
		estimated_inter_network: string;
		estimated_eth: string;
		max_fee_eth: string;
	};
	error: { cannot_fetch_gas_fee: string };
}

interface I18nInfo {
	bitcoin: { title: string; description: string; note: string; how_to: string };
	ethereum: {
		title: string;
		description: string;
		note: string;
		how_to: string;
		how_to_short: string;
	};
}

interface I18nWallet_connect {
	text: {
		name: string;
		session_proposal: string;
		connect: string;
		connecting: string;
		disconnect: string;
		scan_qr: string;
		or_use_link: string;
		proposer: string;
		review: string;
		method: string;
		methods: string;
		events: string;
		message: string;
		hex_data: string;
		raw_copied: string;
		sign_message: string;
	};
	domain: {
		title: string;
		valid: string;
		valid_description: string;
		invalid: string;
		invalid_description: string;
		security_risk: string;
		security_risk_description: string;
		unknown: string;
		unknown_description: string;
	};
	info: {
		disconnected: string;
		session_ended: string;
		connected: string;
		eth_transaction_executed: string;
		sign_executed: string;
	};
	error: {
		qr_code_read: string;
		missing_uri: string;
		disconnect: string;
		connect: string;
		manual_workflow: string;
		skipping_request: string;
		method_not_support: string;
		unexpected_pair: string;
		no_connection_opened: string;
		no_session_approval: string;
		unexpected: string;
		request_rejected: string;
		unknown_parameter: string;
		wallet_not_initialized: string;
		from_address_not_wallet: string;
		unknown_destination: string;
		request_not_defined: string;
		unexpected_processing_request: string;
	};
}

interface I18nTransaction {
	text: {
		details: string;
		hash: string;
		hash_copied: string;
		id: string;
		id_copied: string;
		timestamp: string;
		type: string;
		from: string;
		from_copied: string;
		to: string;
		to_copied: string;
		block: string;
		interacted_with: string;
		pending: string;
		status: string;
	};
	status: { included: string; safe: string; finalised: string };
	label: {
		reimbursement: string;
		twin_token_sent: string;
		ck_token_sent: string;
		twin_token_converted: string;
		ck_token_converted: string;
		receiving_twin_token: string;
		sending_twin_token: string;
		sending_twin_token_failed: string;
		converting_twin_token: string;
		converting_ck_token: string;
		twin_network: string;
	};
	alt: {
		open_block_explorer: string;
		open_from_block_explorer: string;
		open_to_block_explorer: string;
	};
	error: {
		get_block_number: string;
		failed_get_transaction: string;
		failed_get_mined_transaction: string;
	};
}

interface I18nTransactions {
	text: { title: string; no_transactions: string; sign_in: string; open_transactions: string };
	error: {
		loading_transactions: string;
		loading_transactions_symbol: string;
		no_token_loading_transaction: string;
		uncertified_transactions_removed: string;
		loading_pending_ck_ethereum_transactions: string;
		get_transaction_for_hash: string;
		unexpected_transaction_for_hash: string;
	};
}

interface I18nAbout {
	text: { title: string };
	what: {
		text: {
			label: string;
			title: string;
			hold_crypto: string;
			use_eth_dapps: string;
			use_ic_dapps: string;
		};
	};
	how: {
		text: {
			label: string;
			title: string;
			self_custody: string;
			fully_on_chain: string;
			cross_device: string;
			verifiable_credentials: string;
			open_source: string;
		};
	};
}

interface I18n {
	lang: Languages;
	core: I18nCore;
	navigation: I18nNavigation;
	auth: I18nAuth;
	footer: I18nFooter;
	wallet: I18nWallet;
	init: I18nInit;
	hero: I18nHero;
	settings: I18nSettings;
	dapps: I18nDApps;
	networks: I18nNetworks;
	receive: I18nReceive;
	send: I18nSend;
	convert: I18nConvert;
	buy: I18nBuy;
	tokens: I18nTokens;
	fee: I18nFee;
	info: I18nInfo;
	wallet_connect: I18nWallet_connect;
	transaction: I18nTransaction;
	transactions: I18nTransactions;
	about: I18nAbout;
}
