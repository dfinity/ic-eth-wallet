import ModalExitHandler from '$lib/components/ui/ModalExitHandler.svelte';
import { modalStore } from '$lib/stores/modal.store';
import { doPreNavigation } from '$lib/utils/before-navigate.utils';
import { render } from '@testing-library/svelte';
import { get } from 'svelte/store';

describe('ModalExitHandler', async () => {
	it('closes modal on navigation', () => {
		render(ModalExitHandler);

		const id = Symbol('modalId');
		modalStore.openIcpReceive(id);

		expect(get(modalStore)).toEqual({ type: 'icp-receive', id });

		doPreNavigation(() => {}, false);

		expect(get(modalStore)).toBeNull();
	});

	it('closes busy modal on navigation', () => {
		render(ModalExitHandler);

		const id = Symbol('modalId');
		modalStore.openIcpReceive(id);

		expect(get(modalStore)).toEqual({ type: 'icp-receive', id });

		const confirmMessageSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

		doPreNavigation(() => {}, true);

		expect(confirmMessageSpy).toHaveBeenCalled();
		expect(get(modalStore)).toBeNull();
	});

	it('cancels navigation while navigating away from busy modal', () => {
		render(ModalExitHandler);

		const id = Symbol('modalId');
		modalStore.openIcpReceive(id);

		expect(get(modalStore)).toEqual({ type: 'icp-receive', id });

		const confirmMessageSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);
		const cancelSpy = vi.fn();
		doPreNavigation(cancelSpy, true);

		expect(confirmMessageSpy).toHaveBeenCalled();
		expect(cancelSpy).toHaveBeenCalled();
		expect(get(modalStore)).toEqual({ type: 'icp-receive', id });
	});
});
