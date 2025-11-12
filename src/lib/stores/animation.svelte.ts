/**
 * Animation store for managing visual animations and transitions.
 *
 * This store provides centralized animation management for the application,
 * handling animation lifecycle, timing, and coordination.
 *
 * @module stores/animation
 */

import type {
    AnimationType,
    AnimationConfig,
    AnimationState,
    AnimationResult,
    AnimationQueueEntry
} from '$lib/types/animations';

/**
 * Generate a unique animation ID.
 *
 * @returns Unique animation identifier
 */
function generate_animation_id(): string {
    return `anim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Animation store state and methods.
 *
 * Manages all active animations in the application, providing methods to
 * start, stop, pause, and coordinate multiple animations.
 */
class AnimationStore {
    /** Active animations mapped by ID */
    animations = $state<Map<string, AnimationState>>(new Map());

    /** Animation queue for sequential execution */
    queue = $state<AnimationQueueEntry[]>([]);

    /** Whether animations are globally paused */
    paused = $state<boolean>(false);

    /**
     * Get all active animations.
     *
     * @returns Array of active animation states
     */
    get active(): AnimationState[] {
        return Array.from(this.animations.values());
    }

    /**
     * Get animations for a specific target.
     *
     * @param target - Target identifier
     * @returns Array of animations for the target
     */
    get_animations_for_target(target: string): AnimationState[] {
        return this.active.filter((anim) => anim.target === target);
    }

    /**
     * Check if a target has any active animations.
     *
     * @param target - Target identifier
     * @returns True if target has active animations
     */
    is_animating(target: string): boolean {
        return this.get_animations_for_target(target).length > 0;
    }

    /**
     * Start a new animation.
     *
     * @param type - Type of animation
     * @param target - Target identifier (CSS selector, node ID, etc.)
     * @param config - Animation configuration
     * @returns Animation result with ID and promise
     *
     * @example
     * ```ts
     * const result = animation_store.start(
     *   AnimationType.FADE_IN,
     *   '#node-123',
     *   { duration: 300, easing: EasingType.EASE_OUT }
     * );
     * await result.promise;
     * ```
     */
    start(type: AnimationType, target: string, config: AnimationConfig): AnimationResult {
        const id = generate_animation_id();

        // Create promise that resolves when animation completes
        let resolve_fn: (() => void) | undefined;
        let reject_fn: ((reason?: unknown) => void) | undefined;
        const promise = new Promise<void>((resolve, reject) => {
            resolve_fn = resolve;
            reject_fn = reject;
        });

        // Create animation state
        const state: AnimationState = {
            id,
            type,
            target,
            config,
            start_time: Date.now() + (config.delay || 0),
            progress: 0,
            paused: false
        };

        // Store animation
        this.animations.set(id, state);

        // Handle delay
        if (config.delay && config.delay > 0) {
            setTimeout(() => {
                this.run_animation(id, resolve_fn!, reject_fn!);
            }, config.delay);
        } else {
            this.run_animation(id, resolve_fn!, reject_fn!);
        }

        // Return control interface
        return {
            id,
            promise,
            cancel: () => this.cancel(id)
        };
    }

    /**
     * Run the animation loop for a specific animation.
     *
     * @param id - Animation ID
     * @param on_complete - Callback when animation completes
     * @param on_error - Callback when animation errors
     */
    private run_animation(
        id: string,
        on_complete: () => void,
        on_error: (reason?: unknown) => void
    ): void {
        const state = this.animations.get(id);
        if (!state) {
            on_error(new Error(`Animation ${id} not found`));
            return;
        }

        const animate = (current_time: number) => {
            const state = this.animations.get(id);
            if (!state) {
                // Animation was cancelled
                on_error(new Error('Animation cancelled'));
                return;
            }

            // Skip if paused
            if (state.paused || this.paused) {
                state.frame_id = requestAnimationFrame(animate);
                return;
            }

            // Calculate progress
            const elapsed = current_time - state.start_time;
            const progress = Math.min(elapsed / state.config.duration, 1);

            // Update state
            state.progress = progress;

            // Continue animation if not complete
            if (progress < 1) {
                state.frame_id = requestAnimationFrame(animate);
            } else {
                // Animation complete
                this.animations.delete(id);
                state.config.on_complete?.();
                on_complete();
            }
        };

        // Start animation loop
        state.frame_id = requestAnimationFrame(animate);
    }

    /**
     * Cancel an animation.
     *
     * @param id - Animation ID to cancel
     *
     * @example
     * ```ts
     * const result = animation_store.start(AnimationType.FADE_IN, '#node-123', config);
     * // Later...
     * animation_store.cancel(result.id);
     * ```
     */
    cancel(id: string): void {
        const state = this.animations.get(id);
        if (!state) return;

        // Cancel animation frame
        if (state.frame_id !== undefined) {
            cancelAnimationFrame(state.frame_id);
        }

        // Remove from store
        this.animations.delete(id);

        // Call cancel callback
        state.config.on_cancel?.();
    }

    /**
     * Cancel all animations for a specific target.
     *
     * @param target - Target identifier
     *
     * @example
     * ```ts
     * animation_store.cancel_target('#node-123');
     * ```
     */
    cancel_target(target: string): void {
        const animations = this.get_animations_for_target(target);
        animations.forEach((anim) => this.cancel(anim.id));
    }

    /**
     * Cancel all active animations.
     *
     * @example
     * ```ts
     * animation_store.cancel_all();
     * ```
     */
    cancel_all(): void {
        const ids = Array.from(this.animations.keys());
        ids.forEach((id) => this.cancel(id));
    }

    /**
     * Pause an animation.
     *
     * @param id - Animation ID to pause
     */
    pause(id: string): void {
        const state = this.animations.get(id);
        if (state) {
            state.paused = true;
        }
    }

    /**
     * Resume a paused animation.
     *
     * @param id - Animation ID to resume
     */
    resume(id: string): void {
        const state = this.animations.get(id);
        if (state) {
            state.paused = false;
        }
    }

    /**
     * Pause all animations.
     */
    pause_all(): void {
        this.paused = true;
    }

    /**
     * Resume all animations.
     */
    resume_all(): void {
        this.paused = false;
    }

    /**
     * Add an animation to the queue.
     *
     * Queued animations will be executed sequentially after current animations complete.
     *
     * @param target - Target identifier
     * @param type - Animation type
     * @param config - Animation configuration
     * @param priority - Execution priority (higher runs first, default: 0)
     */
    enqueue(target: string, type: AnimationType, config: AnimationConfig, priority = 0): void {
        this.queue.push({ target, type, config, priority });
        // Sort by priority (higher first)
        this.queue.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Process the animation queue.
     *
     * Starts the next queued animation if the target is not currently animating.
     */
    process_queue(): void {
        if (this.queue.length === 0) return;

        // Find first queued animation where target is not animating
        const index = this.queue.findIndex((entry) => !this.is_animating(entry.target));

        if (index === -1) return;

        // Remove from queue and start
        const entry = this.queue.splice(index, 1)[0];
        this.start(entry.type, entry.target, entry.config);
    }

    /**
     * Clear the animation queue.
     */
    clear_queue(): void {
        this.queue = [];
    }

    /**
     * Reset the store to initial state.
     *
     * Cancels all animations and clears the queue.
     */
    reset(): void {
        this.cancel_all();
        this.clear_queue();
        this.paused = false;
    }
}

/**
 * Global animation store instance.
 *
 * @example
 * ```ts
 * import { animation_store } from '$lib/stores/animation.svelte';
 *
 * // Start an animation
 * const result = animation_store.start(
 *   AnimationType.FADE_IN,
 *   '#my-element',
 *   { duration: 300, easing: EasingType.EASE_OUT }
 * );
 *
 * // Wait for completion
 * await result.promise;
 * ```
 */
export const animation_store = new AnimationStore();
