import DappsCarousel from '$lib/components/dapps/DappsCarousel.svelte';
import { CAROUSEL_CONTAINER } from '$lib/constants/test-ids.constants';
import * as dapps from '$lib/types/dapp-description';
import { mockDappsDescriptions } from '$tests/mocks/dapps.mock';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

describe('DappsCarousel', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render nothing if there is no dApps', () => {
		vi.spyOn(dapps, 'dAppDescriptions', 'get').mockReturnValueOnce([]);

		const { container } = render(DappsCarousel);
		expect(container.innerHTML).toBe('');
	});

	it('should render nothing if no dApps has the carousel prop', () => {
		vi.spyOn(dapps, 'dAppDescriptions', 'get').mockReturnValueOnce(
			mockDappsDescriptions.map((dapp) => ({ ...dapp, carousel: undefined }))
		);

		const { container } = render(DappsCarousel);
		expect(container.innerHTML).toBe('');
	});

	it('should render the Carousel when data exist', () => {
		const { getByTestId } = render(DappsCarousel);
		expect(getByTestId(CAROUSEL_CONTAINER)).toBeInTheDocument();
	});
});