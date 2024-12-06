import { defineConfig, devices } from '@playwright/test';
import dotenv, { type DotenvPopulateInput } from 'dotenv';
import { join } from 'node:path';
import { readCanisterIds } from './env.utils';

dotenv.config({
	path: join(process.cwd(), '.env.e2e')
});

dotenv.populate(
	process.env as DotenvPopulateInput,
	readCanisterIds({
		filePath: join(process.cwd(), 'canister_e2e_ids.json'),
		prefix: 'E2E_'
	})
);

const DEV = (process.env.NODE_ENV ?? 'production') === 'development';

const MATRIX_OS = process.env.MATRIX_OS ?? '';
const isMac = MATRIX_OS.includes('macos') ?? process.platform === 'darwin';

const appleProjects = [
	{
		name: 'Safari',
		use: devices['Desktop Safari'],
	},
	{
		name: 'iPhone SE',
		use: devices ['iPhone SE'],
	},
];

const nonAppleProjects = [
	{
		name: 'Google Chrome',
		use: devices['Desktop Chrome'],
	},
	{
    name: 'Firefox',
    use: devices['Desktop Firefox'],
  },
  {
    name: 'Pixel 5',
    use: devices['Pixel 5'],
  },
]

const TIMEOUT = 5 * 60 * 1000;

export default defineConfig({
	timeout: TIMEOUT,
	workers: DEV ? 5 : 2,
	webServer: {
		command: DEV ? 'npm run dev' : 'npm run build && npm run preview',
		reuseExistingServer: true,
		port: DEV ? 5173 : 4173,
		timeout: TIMEOUT
	},
	testDir: 'e2e',
	testMatch: ['**/*.e2e.ts', '**/*.spec.ts'],
	use: {
		testIdAttribute: 'data-tid',
		trace: 'on',
		actionTimeout: TIMEOUT,
		navigationTimeout: TIMEOUT,
		...(DEV && { headless: false })
	},
	projects: isMac ? appleProjects : nonAppleProjects,
});
