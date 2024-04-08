#!/usr/bin/env node

import { existsSync, readdirSync } from 'node:fs';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const deleteIndexes = async ({ dest = `./src/declarations` }) => {
	const promises = readdirSync(dest).map(
		(dir) =>
			new Promise(async (resolve) => {
				const indexPath = join(dest, dir, 'index.js');

				if (!existsSync(indexPath)) {
					resolve();
					return;
				}

				await rm(indexPath, { force: true });

				resolve();
			})
	);

	await Promise.all(promises);
};

/**
 * We have to manipulate the factory otherwise the editor prompt for following TypeScript error:
 *
 * TS7031: Binding element 'IDL' implicitly has an 'any' type.
 *
 */
const cleanFactory = async ({ dest = `./src/declarations` }) => {
	const promises = readdirSync(dest).map(
		(dir) =>
			new Promise(async (resolve) => {
				const factoryPath = join(dest, dir, `${dir}.did.js`);

				if (!existsSync(factoryPath)) {
					resolve();
					return;
				}

				const content = await readFile(factoryPath, 'utf-8');
				const cleanFactory = content.replace(
					/export const idlFactory = \({ IDL }\) => {/g,
					`// @ts-ignore
export const idlFactory = ({ IDL }) => {`
				);
				const cleanInit = cleanFactory.replace(
					/export const init = \({ IDL }\) => {/g,
					`// @ts-ignore
export const init = ({ IDL }) => {`
				);

				await writeFile(factoryPath, cleanInit, 'utf-8');

				resolve();
			})
	);

	await Promise.all(promises);
};

const renameFactory = async ({ dest = `./src/declarations` }) => {
	const promises = readdirSync(dest).map(
		(dir) =>
			new Promise(async (resolve) => {
				const factoryPath = join(dest, dir, `${dir}.did.js`);
				const formattedPath = join(dest, dir, `${dir}.factory.did.js`);

				if (!existsSync(factoryPath)) {
					resolve();
					return;
				}

				await rename(factoryPath, formattedPath);

				resolve();
			})
	);

	await Promise.all(promises);
};

(async () => {
	try {
		await deleteIndexes({});

		await cleanFactory({});

		await renameFactory({});

		console.log(`Types declarations copied!`);
	} catch (err) {
		console.error(`Error while copying the types declarations.`, err);
	}
})();
