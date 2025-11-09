# Copilot Instructions for Logic Graph

## Project Overview

This is a SvelteKit project with static site generation configured for deployment as a static site.

## Language and Technology Stack

- **Primary Language**: TypeScript (NOT JavaScript)
- **Framework**: SvelteKit 5
- **Styling**: Tailwind CSS 4
- **Build Tool**: Bun
- **Testing**: Vitest (unit and component testing)

## Code Standards

Implementation-specific guidelines are documented in `.instructions.md` files:

- TypeScript: See `.github/instructions/typescript.instructions.md`
- Svelte Stores: See `.github/instructions/svelte-store.instructions.md`
- Svelte Components: See `.github/instructions/svelte-components.instructions.md`
- Svelte Routes: See `.github/instructions/svelte-routes.instructions.md`
- General Svelte: See `.github/instructions/svelte.instructions.md`

### Naming Conventions

- **Variables and Functions**: Use `snake_case` (enforced by ESLint)
- **Constants**: Use `UPPER_SNAKE_CASE`
- **Types, Interfaces, and Classes**: Use `PascalCase`
- **Enum Members**: Use `UPPER_CASE`
- **Generic Type Parameters**: Use descriptive `PascalCase` names (e.g., `Value`, `Node`, `Config`) rather than single letters like `T` (except in utility functions)

### File Naming

- **Svelte route files**: Use `+page.svelte`, `+layout.svelte`, `+page.ts`, `+layout.ts`, etc.
- **Svelte component files**: Use `PascalCase.svelte`
- **TypeScript files**: Use `.ts` extension (NOT `.js`)
- **Svelte TypeScript files**: Use `.svelte.ts` extension

### UI Guidelines

- **No emojis**: Do not use emojis in any part of the user interface (buttons, labels, text, etc.)

### Static Site Generation

- All routes are prerendered by default (`prerender = true` in root layout)
- Avoid runtime server-side logic
- Use `@sveltejs/adapter-static` for builds

## Development Commands

- `bun run dev` - Start development server
- `bun run build` - Build static site
- `bun run preview` - Preview production build
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier
- `bun run test:unit` - Run Vitest tests

## Important Notes

- This project uses Bun as the package manager and runtime
- ESLint is configured to enforce snake_case naming conventions
- The project is configured for static site generation, not SSR
