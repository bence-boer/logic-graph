---
applyTo: 'src/lib/components/**/*.svelte'
description: 'Guidelines for reusable Svelte components.'
---

## Component Organization

- Keep component names descriptive and specific
- Group related components in subdirectories

## Component Best Practices

- Use Svelte 5's runes syntax (`$state`, `$derived`, `$effect`)
- Keep components small and focused on a single responsibility
- Prefer composition over inheritance
- Use props for data flow from parent to child
- Use events or callbacks for child-to-parent communication

## Props and State

- Define props with clear TypeScript types
- Use `$state` for component-local reactive data
- Use `$derived` for computed values based on props or state
- Use `$effect` sparingly for side effects
- Prefer reactive declarations over imperative updates

## Accessibility and Responsiveness

- Follow accessibility best practices (ARIA labels, keyboard navigation, etc.)
- Ensure components are responsive and mobile-friendly

## Reusability

- Design components to be reusable across different contexts
- Avoid hard-coding values; use props for configuration
- Provide sensible defaults for optional props
- Document component API with TypeScript types and JSDoc comments
