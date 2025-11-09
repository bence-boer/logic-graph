---
applyTo: 'src/routes/**/*.svelte'
description: 'Guidelines for SvelteKit route components and pages.'
---

## Page Structure

- Keep page components focused on layout and composition
- Delegate complex logic to utility functions or stores
- Use route-specific `+page.ts` files for data loading and configuration
- Use `+layout.svelte` for shared layouts across multiple routes

## Best Practices

- Prefer local state for page-specific data
- Use stores only for truly global application state
- Keep pages responsive and accessible
