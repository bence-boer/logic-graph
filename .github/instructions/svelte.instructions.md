---
applyTo: '**/*.svelte'
description: 'Guidelines for Svelte components and pages using Svelte 5 runes syntax.'
---

## Svelte Best Practices

- Use Svelte 5's runes syntax (`$state`, `$derived`, `$effect`, etc.)
- Prefer composition over inheritance
- Keep components small and focused

## State Management

- **Prefer component props and local state**: Use direct property passing and component-level `$state` runes for most data flow
- **Avoid premature global state**: Only create stores when data genuinely needs to be shared across multiple, disconnected parts of the application
- Use local `$state` for component-specific reactive data
- Use `$derived` for computed values
- Use `$effect` for side effects, but try to minimize their use
