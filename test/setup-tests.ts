// Global test setup for Vitest

// Minimal stub for Svelte runes used in stores during tests.
; (globalThis as unknown as Record<string, unknown>).$state = <T>(v: T) => v;

// Minimal DOM event constructors for environments that don't provide them
if (typeof (globalThis as unknown as Record<string, unknown>).PointerEvent === 'undefined') {
    // Simple no-op class that mirrors the constructor signature
    (globalThis as unknown as Record<string, unknown>).PointerEvent = class PointerEvent extends Event {
        constructor(type: string, init?: Record<string, unknown>) {
            super(type);
            if (init) Object.assign(this, init as object);
        }
    } as unknown as typeof PointerEvent;
}

if (typeof (globalThis as unknown as Record<string, unknown>).TouchEvent === 'undefined') {
    (globalThis as unknown as Record<string, unknown>).TouchEvent = class TouchEvent extends Event {
        constructor(type: string, init?: Record<string, unknown>) {
            super(type);
            if (init) Object.assign(this, init as object);
        }
    } as unknown as typeof TouchEvent;
}

// Provide a minimal crypto.randomUUID if environment lacks it (Node 14/16)
if (typeof (globalThis as unknown as Record<string, unknown>).crypto === 'undefined') {
    (globalThis as unknown as Record<string, unknown>).crypto = { randomUUID: () => Math.random().toString(36).slice(2) } as unknown as Crypto;
} else if (typeof ((globalThis as unknown as Record<string, unknown>).crypto as Crypto).randomUUID === 'undefined') {
    ((globalThis as unknown as Record<string, unknown>).crypto as unknown as { randomUUID?: () => string }).randomUUID = () => Math.random().toString(36).slice(2);
}

// Provide small compatibility shims for Vitest helpers that may not exist in
// older/newer runner environments when tests assume them.
if (typeof (globalThis as unknown as Record<string, unknown>).vi !== 'undefined') {
    type VitestCompat = {
        mocked?: <T>(v: T) => T;
        advanceTimersByTime?: (ms: number) => unknown;
        tick?: (ms: number) => unknown;
        runAllTimers?: () => unknown;
        [k: string]: unknown;
    };

    const vi = (globalThis as unknown as Record<string, unknown>).vi as VitestCompat;

    // vi.mocked is a helper in some Vitest versions. If missing, add a no-op
    // wrapper that preserves the original value (tests cast/spy as needed).
    if (typeof vi.mocked === 'undefined') {
        vi.mocked = <T>(v: T) => v as unknown as T;
    }

    // advanceTimersByTime is expected by some tests after vi.useFakeTimers(). If
    // it's not available, provide a best-effort shim that delegates to
    // runAllTimers / tick if present, or is a no-op otherwise.
    if (typeof vi.advanceTimersByTime === 'undefined') {
        vi.advanceTimersByTime = (ms: number) => {
            // Prefer a real time-advancing API if available
            if (typeof vi.tick === 'function') {
                return vi.tick!(ms);
            }

            if (typeof vi.runAllTimers === 'function') {
                return vi.runAllTimers!();
            }

            return undefined;
        };
    }
}
