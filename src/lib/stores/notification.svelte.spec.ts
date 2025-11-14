import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_PRESETS, NOTIFICATION_PRESETS, notification_store, type NotificationPresetID } from './notification.svelte';

describe('notification_store', () => {
    beforeEach(() => {
        notification_store.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('show', () => {
        it('should add a notification', () => {
            const id = notification_store.show('Test message', 'info');

            expect(id).toBeTruthy();
            expect(notification_store.notifications).toHaveLength(1);
            expect(notification_store.notifications[0].message).toBe('Test message');
            expect(notification_store.notifications[0].type).toBe('info');
        });

        it('should auto-dismiss notification after duration', async () => {
            // Use real timers for this test to avoid incompatibilities with the
            // fake-timer APIs across runner versions. Keep duration short so the
            // test runs quickly.
            vi.useRealTimers();

            notification_store.show('Test', 'info', { duration: 10 });

            expect(notification_store.notifications).toHaveLength(1);

            // Wait slightly longer than the duration
            await new Promise((resolve) => setTimeout(resolve, 20));

            expect(notification_store.notifications).toHaveLength(0);

            // Restore fake timers for other tests
            vi.useFakeTimers();
        });

        it('should not auto-dismiss when duration is 0', () => {
            notification_store.show('Test', 'info', { duration: 0 });

            expect(notification_store.notifications).toHaveLength(1);

            if (typeof vi.advanceTimersByTime === 'function') {
                vi.advanceTimersByTime(10000);
            } else if (typeof vi.runAllTimers === 'function') {
                vi.runAllTimers();
            }

            expect(notification_store.notifications).toHaveLength(1);
        });

        it('should support action buttons', () => {
            const actions = [
                { label: 'Undo', command: 'history.undo' },
                { label: 'Retry', command: 'retry.action' }
            ];

            notification_store.show('Test', 'error', { actions });

            expect(notification_store.notifications[0].actions).toEqual(actions);
        });

        it('should group notifications by group_key', () => {
            notification_store.show('Message 1', 'info', { group_key: 'test-group' });
            notification_store.show('Message 2', 'info', { group_key: 'test-group' });

            expect(notification_store.grouped_notifications['test-group']).toHaveLength(2);
        });
    });

    describe('convenience methods', () => {
        it('should show success notification', () => {
            notification_store.success('Success!');

            expect(notification_store.notifications[0].type).toBe('success');
            expect(notification_store.notifications[0].message).toBe('Success!');
        });

        it('should show error notification with longer duration', () => {
            notification_store.error('Error!');

            expect(notification_store.notifications[0].type).toBe('error');
            expect(notification_store.notifications[0].duration).toBe(5000);
        });

        it('should show warning notification', () => {
            notification_store.warning('Warning!');

            expect(notification_store.notifications[0].type).toBe('warning');
            expect(notification_store.notifications[0].duration).toBe(4000);
        });

        it('should show info notification', () => {
            notification_store.info('Info!');

            expect(notification_store.notifications[0].type).toBe('info');
        });
    });

    describe('success_for_command', () => {
        it('should use preset for known command', () => {
            const id = notification_store.success_for_command('graph.node.create');

            expect(id).toBeTruthy();
            expect(notification_store.notifications[0].message).toBe('Node created');
            expect(notification_store.notifications[0].type).toBe('success');
        });

        it('should use template function with data', () => {
            notification_store.success_for_command('graph.node.delete', {
                node_ids: ['1', '2', '3']
            });

            expect(notification_store.notifications[0].message).toBe('3 nodes deleted');
        });

        it('should include actions from preset', () => {
            notification_store.success_for_command('graph.node.delete', { node_ids: ['1'] });

            expect(notification_store.notifications[0].actions).toBeDefined();
            expect(notification_store.notifications[0].actions?.[0].label).toBe('Undo');
            expect(notification_store.notifications[0].actions?.[0].command).toBe('history.undo');
        });

        it('should return undefined for unknown command', () => {
            const id = notification_store.success_for_command('unknown.command' as NotificationPresetID);

            expect(id).toBeUndefined();
            expect(notification_store.notifications).toHaveLength(0);
        });
    });

    describe('error_for_command', () => {
        it('should use preset error message for known command', () => {
            notification_store.error_for_command('graph.node.create', 'Invalid data');

            expect(notification_store.notifications[0].message).toBe(
                'Failed to create node: Invalid data'
            );
            expect(notification_store.notifications[0].type).toBe('error');
        });

        it('should use raw error for unknown command', () => {
            notification_store.error_for_command('unknown.command', 'Something went wrong');

            expect(notification_store.notifications[0].message).toBe('Something went wrong');
        });
    });

    describe('remove', () => {
        it('should remove notification by id', () => {
            const id = notification_store.show('Test', 'info');

            expect(notification_store.notifications).toHaveLength(1);

            notification_store.remove(id);

            expect(notification_store.notifications).toHaveLength(0);
        });

        it('should remove notification from group', () => {
            const id = notification_store.show('Test', 'info', { group_key: 'test-group' });

            expect(notification_store.grouped_notifications['test-group']).toHaveLength(1);

            notification_store.remove(id);

            expect(notification_store.grouped_notifications['test-group']).toBeUndefined();
        });
    });

    describe('remove_group', () => {
        it('should remove all notifications in a group', () => {
            notification_store.show('Message 1', 'info', { group_key: 'test-group' });
            notification_store.show('Message 2', 'info', { group_key: 'test-group' });
            notification_store.show('Message 3', 'info', { group_key: 'other-group' });

            expect(notification_store.notifications).toHaveLength(3);

            notification_store.remove_group('test-group');

            expect(notification_store.notifications).toHaveLength(1);
            expect(notification_store.grouped_notifications['test-group']).toBeUndefined();
            expect(notification_store.grouped_notifications['other-group']).toHaveLength(1);
        });
    });

    describe('clear', () => {
        it('should remove all notifications', () => {
            notification_store.show('Test 1', 'info');
            notification_store.show('Test 2', 'error');
            notification_store.show('Test 3', 'success');

            expect(notification_store.notifications).toHaveLength(3);

            notification_store.clear();

            expect(notification_store.notifications).toHaveLength(0);
        });

        it('should clear all groups', () => {
            notification_store.show('Test 1', 'info', { group_key: 'group1' });
            notification_store.show('Test 2', 'info', { group_key: 'group2' });

            notification_store.clear();

            expect(Object.keys(notification_store.grouped_notifications)).toHaveLength(0);
        });
    });

    describe('count', () => {
        it('should return total notification count', () => {
            expect(notification_store.count).toBe(0);

            notification_store.show('Test 1', 'info');
            notification_store.show('Test 2', 'error');

            expect(notification_store.count).toBe(2);
        });
    });

    describe('count_by_type', () => {
        it('should return count for specific type', () => {
            notification_store.show('Test 1', 'info');
            notification_store.show('Test 2', 'error');
            notification_store.show('Test 3', 'error');

            expect(notification_store.count_by_type('info')).toBe(1);
            expect(notification_store.count_by_type('error')).toBe(2);
            expect(notification_store.count_by_type('success')).toBe(0);
        });
    });
});

describe('NOTIFICATION_PRESETS', () => {
    it('should have presets for core commands', () => {
        expect(NOTIFICATION_PRESETS['graph.node.create']).toBeDefined();
        expect(NOTIFICATION_PRESETS['graph.node.update']).toBeDefined();
        expect(NOTIFICATION_PRESETS['graph.node.delete']).toBeDefined();
        expect(NOTIFICATION_PRESETS['graph.connection.create']).toBeDefined();
        expect(NOTIFICATION_PRESETS['graph.connection.delete']).toBeDefined();
        expect(NOTIFICATION_PRESETS['history.undo']).toBeDefined();
        expect(NOTIFICATION_PRESETS['history.redo']).toBeDefined();
    });

    it('should define appropriate durations', () => {
        // Quick actions should have shorter durations
        expect(NOTIFICATION_PRESETS['graph.node.update'].duration).toBe(2000);

        // Destructive actions should have longer durations (time to undo)
        expect(NOTIFICATION_PRESETS['graph.node.delete'].duration).toBe(4000);

        // Errors should have longer durations
        expect(NOTIFICATION_PRESETS['graph.connection.delete'].duration).toBeGreaterThanOrEqual(
            3000
        );
    });
});

describe('ERROR_PRESETS', () => {
    it('should have error messages for core commands', () => {
        expect(ERROR_PRESETS['graph.node.create']).toBe('Failed to create node');
        expect(ERROR_PRESETS['graph.node.update']).toBe('Failed to update node');
        expect(ERROR_PRESETS['graph.node.delete']).toBe('Failed to delete node');
        expect(ERROR_PRESETS['history.undo']).toBe('Nothing to undo');
        expect(ERROR_PRESETS['history.redo']).toBe('Nothing to redo');
    });
});
