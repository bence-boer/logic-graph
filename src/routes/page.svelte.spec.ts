import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

// This test uses Playwright-backed helpers and should only run in the
// browser project. If the test is executed in the Node/server project,
// skip it to avoid importing browser-only helpers.
if ((globalThis as unknown as { __vitest_browser__?: unknown }).__vitest_browser__) {
    // Import inside the runtime branch so the browser helper module is only
    // required when running in the browser provider.
    void import('vitest-browser-svelte').then(({ render }) => {
        describe('/+page.svelte', () => {
            it('should render without errors', () => {
                const { container } = render(Page);
                expect(container).toBeTruthy();
            });
        });
    });
} else {
    describe.skip('/+page.svelte (browser-only)', () => {
        it('skipped in node environment', () => { });
    });
}
