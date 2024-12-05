import type { UserProfile } from '$declarations/backend/backend.did';
import DappsCarousel from '$lib/components/dapps/DappsCarousel.svelte';
import { CAROUSEL_CONTAINER } from '$lib/constants/test-ids.constants';
import { userProfileStore } from '$lib/stores/user-profile.store';
import * as dapps from '$lib/types/dapp-description';
import { mockDappsDescriptions } from '$tests/mocks/dapps.mock';
import { mockUserProfile } from '$tests/mocks/user-profile.mock';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

describe('DappsCarousel', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		userProfileStore.set({ profile: mockUserProfile, certified: false });
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

	it('should render nothing if all dApps were hidden', () => {
		const userProfile: UserProfile = {
			...mockUserProfile,
			settings: {
				...mockUserProfile.settings,
				dapp: {
					...mockUserProfile.settings.dapp,
					dapp_carousel: {
						...mockUserProfile.settings.dapp.dapp_carousel,
						hidden_dapp_ids: mockDappsDescriptions.map(({ id }) => id)
					}
				}
			}
		};

		userProfileStore.set({ profile: userProfile, certified: false });

		const { container } = render(DappsCarousel);
		expect(container.innerHTML).toBe('');
	});

	it('should render nothing if the user profile is nullish', () => {
		userProfileStore.reset();

		const { container } = render(DappsCarousel);
		expect(container.innerHTML).toBe('');
	});

	it('should render the Carousel when data exist', () => {
		const { getByTestId } = render(DappsCarousel);
		expect(getByTestId(CAROUSEL_CONTAINER)).toBeInTheDocument();
	});
});
