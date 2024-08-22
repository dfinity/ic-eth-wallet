import { ABOUT_WHAT_MODAL, ABOUT_WHAT_MODAL_OPEN_BUTTON } from '$lib/constants/test-ids.constant';
import { test } from '@playwright/test';
import { ABOUT_MODALS_VIEWPORT_WIDTH } from './utils/constants/e2e.constants';
import { HomepageLoggedOut } from './utils/pages/homepage.page';

const ABOUT_WHAT_MODAL_VIEWPORT_HEIGHT = 930;

test('should display about-what modal', async ({ page }) => {
	const homepageLoggedOut = new HomepageLoggedOut({ page });

	await homepageLoggedOut.testModalSnapshot({
		viewportSize: {
			width: ABOUT_MODALS_VIEWPORT_WIDTH,
			height: ABOUT_WHAT_MODAL_VIEWPORT_HEIGHT
		},
		modalOpenButtonTestId: ABOUT_WHAT_MODAL_OPEN_BUTTON,
		modalTestId: ABOUT_WHAT_MODAL
	});
});
