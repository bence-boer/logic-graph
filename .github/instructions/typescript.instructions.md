---
applyTo: '**/*.ts'
description: 'TypeScript coding standards and best practices.'
---

## TypeScript Usage

- Always use TypeScript for all new files
- Prefer explicit type annotations where it improves code clarity
- Use TypeScript's strict mode features

## Best Practices

- Prefer using enums for enumerable values instead of string union types
- Use `as const satisfies SomeType` for composite constant data structures to ensure type safety while preserving literal types
