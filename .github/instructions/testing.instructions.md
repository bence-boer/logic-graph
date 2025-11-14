# Testing guidance — condensed

This short guide collects the practical lessons we applied to get the Vitest/Bun test-suite stable for this SvelteKit project.

Purpose
- Give concise, copy-paste-friendly patterns for tests in this repo.
- Explain why certain tests needed shims or lazy imports and how to write them safely.

Quick checklist (fast)
- Add a global test setup file (`test/setup-tests.ts`) that installs runtime shims (Svelte runes, minimal DOM, crypto.randomUUID, vi shims).
- Register the setup file in `vite.config.ts` for all Vitest projects (client & server) using `setupFiles`.
- Avoid importing app modules that instantiate stores at top-level inside a spec — use lazy/dynamic imports inside `beforeAll`/`beforeEach` instead.
- Mark or guard browser-only tests so they don't import browser helpers in Node-mode.
- Make timer-based tests deterministic: prefer an approach compatible with your Vitest/vi version (useRealTimers for a short wait or robust fake-timer usage + shims).

Common root causes we fixed
- ReferenceError: $state is not defined — caused by Svelte rune usage in stores during module evaluation in Node-mode. Fix: ensure `test/setup-tests.ts` runs before those modules or avoid importing those modules until after shims are installed.
- ReferenceError: Cannot access 'X' before initialization — caused by circular imports / module-eval ordering; fix by lazy-importing or introducing small test-local doubles.
- "vitest/browser can be imported only inside the Browser Mode" — caused by importing browser-only helpers (Playwright/happy-dom helpers) in the Node project; fix by guarding dynamic imports or moving test to a browser-only project.
- Timer API mismatches (vi.advanceTimersByTime not available) — handle by adding compatibility shims in the setup file or by using short real timers in the test.

Essential patterns and examples

1) Global test setup (recommended: `test/setup-tests.ts`)
- Purpose: install lightweight shims early so modules that read `$state` or expect `PointerEvent` don't crash at import-time.
- Minimal example (TypeScript):

```ts
// test/setup-tests.ts
; (globalThis as unknown as Record<string, unknown>).$state = <T>(v: T) => v;

// Minimal PointerEvent/TouchEvent if not present
if (typeof (globalThis as any).PointerEvent === 'undefined') {
  (globalThis as any).PointerEvent = class PointerEvent extends Event {
    constructor(type: string, init?: Record<string, unknown>) {
      super(type);
      if (init) Object.assign(this, init);
    }
  };
}

// crypto.randomUUID fallback for older node runtimes
if (typeof (globalThis as any).crypto === 'undefined') {
  (globalThis as any).crypto = { randomUUID: () => Math.random().toString(36).slice(2) } as Crypto;
} else if (typeof (globalThis as any).crypto.randomUUID === 'undefined') {
  (globalThis as any).crypto.randomUUID = () => Math.random().toString(36).slice(2);
}

// Vitest compatibility shims (best-effort)
if (typeof (globalThis as any).vi !== 'undefined') {
  const vi = (globalThis as any).vi as any;
  if (typeof vi.mocked === 'undefined') vi.mocked = (v: any) => v;
  if (typeof vi.advanceTimersByTime === 'undefined') {
    vi.advanceTimersByTime = (ms: number) => {
      if (typeof vi.tick === 'function') return vi.tick(ms);
      if (typeof vi.runAllTimers === 'function') return vi.runAllTimers();
      return undefined;
    };
  }
}
```

Register this file in your Vitest config (top-level and per-project if you have multiple Vitest projects):

```ts
// vite.config.ts (vitest config)
test: {
  setupFiles: ['./test/setup-tests.ts'],
  // ...or inside each project
  projects: [
    { name: 'node', setupFiles: ['./test/setup-tests.ts'], /* ... */ },
    { name: 'browser', setupFiles: ['./test/setup-tests.ts'], /* ... */ }
  ]
}
```

2) Defer risky imports (lazy/dynamic import)
- If a module imports stores that reference `$state` at top-level, don't `import` it at the top of the spec file. Import it inside a lifecycle hook AFTER the setup file runs.

Example:

```ts
// Bad: top-level import causes module-eval error
// import { something } from '$lib/stores/problematic';

// Good: lazy import in beforeAll / beforeEach
let problematic: typeof import('$lib/stores/problematic');
beforeAll(async () => {
  problematic = await import('$lib/stores/problematic');
});
```

3) Guard browser-only tests
- Browser helpers (Playwright/happy-dom, `vitest-browser-svelte`, etc.) may throw if loaded when Vitest runs the Node project. Guard them:

- Option A: Use the browser project configuration so those files only run there.
- Option B: Guard with runtime check and dynamic import in the spec so Node-mode skips the browser helper import.

Example (guard + dynamic import):

```ts
if ((globalThis as unknown as { __vitest_browser__?: unknown }).__vitest_browser__) {
  void import('vitest-browser-svelte').then(({ render }) => {
    describe('page', () => {
      it('renders', () => {
        const { container } = render(Page);
        expect(container).toBeTruthy();
      });
    });
  });
} else {
  describe.skip('page (browser-only)', () => {
    it('skipped in node environment', () => {});
  });
}
```

4) Timer-based tests (deterministic strategies)
- Runner versions differ in available `vi` timer APIs. Options:
  - Use `vi.useFakeTimers()` + `vi.advanceTimersByTime(ms)` if your environment supports it.
  - Add a compatibility shim for `vi.advanceTimersByTime` in `test/setup-tests.ts` (see above).
  - If fake timers are flaky across environments, use short real timers in that spec and `await new Promise(resolve => setTimeout(resolve, duration + margin))`.

Example (short real wait):

```ts
it('auto-dismisses notification', async () => {
  vi.useRealTimers();
  notification_store.show('x', 'info', { duration: 10 });
  await new Promise((r) => setTimeout(r, 20));
  expect(notification_store.notifications).toHaveLength(0);
  vi.useFakeTimers();
});
```

5) When to create small test-local doubles
- If a module (e.g. a central executor) imports many app modules or creates stores on import, prefer providing a small local test double in the spec to exercise the public API without importing the entire app graph. This avoids circular/import-time issues and keeps unit tests focused.

6) Troubleshooting flow (fast)
- If you see "$state is not defined": make sure `test/setup-tests.ts` is registered and runs before that spec; otherwise lazy-import the module after the setup runs.
- If you see "Cannot access 'X' before initialization": look for circular imports; try lazy imports or simplify by injecting a test double.
- If you see "vitest/browser can be imported only inside the Browser Mode": identify the spec importing `vitest-browser-*` and either guard it or move it to the browser-only test project.

Mini checklist before committing test changes
- [ ] Did I avoid importing app modules at the top of a spec that instantiate stores? If not, lazy-import.
- [ ] Did I register `test/setup-tests.ts` in `vite.config.ts` for the right projects?
- [ ] Do browser-only tests have guards or live in the browser test project?
- [ ] Are timer-based tests deterministic and compatible with runner APIs?
- [ ] Did I add a small test-local double instead of importing the app module when appropriate?

Commands — how to run tests locally

```bash
# run unit tests (this repo uses bun to invoke Vitest)
bun test

# or via npm script
npm run test
```

Notes & rationale
- These patterns are defensive: they avoid module-eval-time side-effects (Svelte runes, stores, browser helpers). They make tests robust across CI and developer machines and reduce flakiness when Vitest versions or environments differ.
- Keep per-spec changes minimal: prefer global setup and lazy imports over scattering per-file setup imports.

If you want, I can:
- Add a short CI job that runs the browser/project Playwright tests separately so browser-only specs run in CI too.
- Add a small lint rule or developer README hint to avoid top-level store imports in specs.

End of guide.
