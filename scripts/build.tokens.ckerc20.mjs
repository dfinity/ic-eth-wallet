#!/usr/bin/env node

import { AnonymousIdentity } from '@dfinity/agent';
import { CkETHOrchestratorCanister } from '@dfinity/cketh';
import { IcrcLedgerCanister } from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';
import { createAgent, fromNullable, isNullish, jsonReplacer } from '@dfinity/utils';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const orchestratorInfo = async ({ orchestratorId: canisterId }) => {
	const agent = await createAgent({
		identity: new AnonymousIdentity(),
		host: 'https://icp-api.io'
	});

	const { getOrchestratorInfo } = CkETHOrchestratorCanister.create({
		agent,
		canisterId
	});

	return getOrchestratorInfo({ certified: true });
};

const buildOrchestratorInfo = async (orchestratorId) => {
	const { managed_canisters } = await orchestratorInfo({ orchestratorId });

	const mapManagedCanisters = (
		acc,
		{ ledger, index, ckerc20_token_symbol, erc20_contract: { address: erc20ContractAddress } }
	) => {
		const ledgerCanister = fromNullable(ledger);
		const indexCanister = fromNullable(index);

		// Skip tokens without Ledger or Index (by definition, this can happen).
		if (isNullish(ledgerCanister) || isNullish(indexCanister)) {
			return acc;
		}

		const { canister_id: ledgerCanisterId } =
			'Created' in ledgerCanister ? ledgerCanister.Created : ledgerCanister.Installed;
		const { canister_id: indexCanisterId } =
			'Created' in indexCanister ? indexCanister.Created : indexCanister.Installed;

		return {
			...acc,
			[ckerc20_token_symbol]: [
				...(acc[ckerc20_token_symbol] ?? []),
				{
					ledgerCanisterId: ledgerCanisterId.toText(),
					indexCanisterId: indexCanisterId.toText(),
					erc20ContractAddress
				}
			]
		};
	};

	const tokens = managed_canisters.reduce(mapManagedCanisters, {});

	const assertUniqueTokenSymbol = Object.values(tokens).find((value) => value.length > 1);

	if (assertUniqueTokenSymbol !== undefined) {
		throw new Error(
			`More than one pair of ledger and index canisters were used for the token symbol ${assertUniqueTokenSymbol}.`
		);
	}

	return Object.entries(tokens).reduce(
		(acc, [key, value]) => ({
			...acc,
			[key]: value[0]
		}),
		{}
	);
};

const ORCHESTRATOR_STAGING_ID = Principal.fromText('2s5qh-7aaaa-aaaar-qadya-cai');
const ORCHESTRATOR_PRODUCTION_ID = Principal.fromText('vxkom-oyaaa-aaaar-qafda-cai');

const DATA_FOLDER = join(process.cwd(), 'src', 'frontend', 'src', 'env');

const LOGO_FOLDER = join(process.cwd(), 'src', 'frontend', 'src', 'icp-eth', 'assets');

const saveTokenLogo = async (canisterId, name) => {
	const logoName = name.toLowerCase().replace('ck', '').replace('sepolia', '');
	const file = join(LOGO_FOLDER, `${logoName}.svg`);

	if (existsSync(file)) {
		return;
	}

	const agent = await createAgent({
		identity: new AnonymousIdentity(),
		host: 'https://icp-api.io'
	});

	const { metadata } = IcrcLedgerCanister.create({
		agent,
		canisterId
	});

	const data = await metadata({});

	const logoData = data.find((item) => item[0] === 'icrc1:logo')[1].Text;

	const [encoding, encodedStr] = logoData.split(';')[1].split(',');

	const svgContent = Buffer.from(encodedStr, encoding).toString('utf-8');

	writeFileSync(file, svgContent, 'utf-8');
};

const findCkErc20 = async () => {
	const [staging, production] = await Promise.all(
		[ORCHESTRATOR_STAGING_ID, ORCHESTRATOR_PRODUCTION_ID].map(buildOrchestratorInfo)
	);

	const tokens = {
		production,
		staging
	};

	writeFileSync(join(DATA_FOLDER, 'tokens.ckerc20.json'), JSON.stringify(tokens, jsonReplacer, 8));

	for (const [name, { ledgerCanisterId }] of Object.entries({
		...tokens.production,
		...tokens.staging
	})) {
		await saveTokenLogo(ledgerCanisterId, name);
	}
};

try {
	await findCkErc20();
} catch (err) {
	console.error(err);
}
