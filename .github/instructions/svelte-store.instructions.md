---
applyTo: '**/*.svelte.ts'
description: 'Guidelines for creating Svelte stores using Svelte 5 runes syntax.'
---

## When to Use Stores

- **Prefer component props and local state**: Use direct property passing and component-level `$state` runes for most data flow
- **Avoid premature global state**: Only create stores when data genuinely needs to be shared across multiple, disconnected parts of the application
- **Global state should be exceptional**: Stores are for application-wide concerns (e.g., user authentication, theme, global UI state), not for general data passing

## Svelte 5 Runes Store Pattern

Stores encapsulate reactive state using Svelte 5's runes system. Each store is a singleton that maintains consistent state across the application.

## Implementation Rules

- **File Structure**: Stores must be in `.svelte.ts` files
- **Multiple Exports**: A single file can export multiple stores
- **Singleton Pattern**: Each exported store is a single instance shared across all imports
- **No Initialization Required**: Stores are ready to use immediately upon import
- **Naming**: Store names should use `snake_case` and typically end with `_store`

## Store Structure

Each store must have:

- Internal `$state` rune variable (prefix with `_` to indicate private)
- `data` getter: Returns the current state value
- `data` setter: Updates the state value
- IIFE wrapper to encapsulate the state

## Type Safety

- Provide explicit type annotations for clarity

## Usage

Access store data with `store_name.data`

## Examples

```ts
// Example: counter_store.svelte.ts
export const counter_store = (() => {
    let _state = $state(0);

    return {
        get data() {
            return _state;
        },
        set data(value: number) {
            _state = value;
        }
    };
})();

// Example: Generic typed store
export function create_store<T>(initial_value: T) {
    let _state = $state(initial_value);

    return {
        get data() {
            return _state;
        },
        set data(value: T) {
            _state = value;
        }
    };
}

// Example: Composite store with multiple fields
export const user_store = (() => {
    let _name = $state('');
    let _age = $state(0);
    let _email = $state('');

    return {
        name: {
            get data() {
                return _name;
            },
            set data(value: string) {
                _name = value;
            }
        },
        age: {
            get data() {
                return _age;
            },
            set data(value: number) {
                _age = value;
            }
        },
        email: {
            get data() {
                return _email;
            },
            set data(value: string) {
                _email = value;
            }
        }
    };
})();
```
