import TokenLogo from '$lib/components/tokens/TokenLogo.svelte';
import { replacePlaceholders } from '$lib/utils/i18n.utils';
import en from '$tests/mocks/i18n.mock';
import { mockValidIcToken } from '$tests/mocks/ic-tokens.mock';
import { render } from '@testing-library/svelte';

describe('TokenLogo', () => {
	const mockToken = {
		...mockValidIcToken,
		icon: 'token-icon-url',
		network: {
			...mockValidIcToken.network,
			icon: 'network-icon-url',
			iconBW: 'network-icon-bw-url'
		}
	};

	it('should render the main logo', () => {
		const { getByTestId, getByAltText } = render(TokenLogo, {
			props: { data: mockToken, testId: 'token-logo' }
		});

		expect(getByTestId('token-logo')).toBeInTheDocument();

		const expected = replacePlaceholders(en.core.alt.logo, { $name: mockToken.name });

		expect(getByAltText(expected)).toBeInTheDocument();
	});

	it('should not render the badge when it is not provided', () => {
		const { queryByTestId } = render(TokenLogo, {
			props: { data: { ...mockToken, icon: undefined }, badgeTestId: 'token-logo-badge' }
		});

		expect(queryByTestId('token-logo-badge')).toBeNull();
	});

	describe('when badge type is "tokenCount"', () => {
		it('should display token count badge when count > 0', () => {
			const { getByTestId, getByText } = render(TokenLogo, {
				props: {
					data: mockToken,
					badge: { type: 'tokenCount', count: 123 },
					badgeTestId: 'token-count-badge'
				}
			});

			expect(getByTestId('token-count-badge')).toBeInTheDocument();
			expect(getByText('123')).toBeInTheDocument();
		});

		it('should not display token count badge when count is 0', () => {
			const { queryByTestId } = render(TokenLogo, {
				props: {
					data: mockToken,
					badge: { type: 'tokenCount', count: 0 },
					badgeTestId: 'token-count-badge'
				}
			});

			expect(queryByTestId('token-count-badge')).toBeNull();
		});
	});

	describe('when badge type is "network"', () => {
		it('should display network icon badge', () => {
			const { getByTestId, getByAltText } = render(TokenLogo, {
				props: { data: mockToken, badge: { type: 'network' }, badgeTestId: 'network-badge' }
			});

			expect(getByTestId('network-badge')).toBeInTheDocument();

			const expected = replacePlaceholders(en.core.alt.logo, {
				$name: mockToken.network.name
			});

			const networkBadge = getByAltText(expected);
			expect(networkBadge).toBeInTheDocument();
			expect(networkBadge).toHaveAttribute('src', 'network-icon-url');
		});

		it('should display black-and-white network icon when set to black and white', () => {
			const { getByTestId, getByAltText } = render(TokenLogo, {
				props: {
					data: mockToken,
					badge: { type: 'network', blackAndWhite: true },
					badgeTestId: 'network-badge'
				}
			});

			expect(getByTestId('network-badge')).toBeInTheDocument();

			const expected = replacePlaceholders(en.core.alt.logo, {
				$name: mockToken.network.name
			});

			const networkBadge = getByAltText(expected);
			expect(networkBadge).toBeInTheDocument();
			expect(networkBadge).toHaveAttribute('src', 'network-icon-bw-url');
		});
	});
});