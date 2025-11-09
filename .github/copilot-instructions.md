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

---

## Tech Debt Prevention Rules

**Last Updated:** November 9, 2025  
**Based on:** TECH_DEBT_PLAN.md analysis

These rules are mandatory for all code contributions to prevent accumulation of technical debt.

### 1. Component Size Limits

**RULE:** Components must not exceed the following line limits (excluding imports and blank lines):

- **Page Components** (routes/+page.svelte): **100 lines maximum**
- **Feature Components** (complex UI features): **150 lines maximum**
- **UI Components** (reusable UI elements): **100 lines maximum**
- **Utility Modules**: **300 lines maximum**

**Extraction strategies:**

- Business logic → Move to utility functions
- Calculations → Move to helper functions
- API calls → Move to services
- Complex state → Move to stores
- Repeated UI patterns → Extract to sub-components
- Logical sections (header, body, footer) → Separate components
- Form groups → Individual field components

**Component directory structure for complex components:**

```
ComponentName/
├── index.ts              # Barrel export
├── ComponentName.svelte  # Main orchestrator
├── SubComponentA.svelte  # Sub-component
├── SubComponentB.svelte  # Sub-component
└── utils/
    └── helpers.ts        # Component-specific utilities
```

**Example:**

```typescript
// ❌ BAD: 500-line component doing everything
<script lang="ts">
  // Lots of state management
  // Lots of business logic
  // Lots of event handlers
  // Lots of computed values
</script>

<div>
  <!-- Hundreds of lines of markup -->
</div>

// ✅ GOOD: Orchestrator pattern
<script lang="ts">
  import ComponentHeader from './ComponentHeader.svelte';
  import ComponentBody from './ComponentBody.svelte';
  import { component_logic } from './utils/logic';

  // Minimal orchestration code
</script>

<ComponentHeader />
<ComponentBody />
```

---

### 2. Type Safety - ZERO Tolerance for `any`

**RULE:** The `any` type is **FORBIDDEN** in all code. No exceptions.

**Approaches when tempted to use `any`:**

- Create a proper type or interface
- Use generic types for flexibility
- Use `unknown` when type is truly unknown, then narrow with type guards
- Extend library types when needed

**Type assertion guidelines:**

- `as Type` is acceptable ONLY when you know more than TypeScript
- Always prefer type guards over type assertions
- Document WHY the assertion is safe with a comment

---

### 3. Logic Extraction - Keep Components Pure

**RULE:** Components should focus on presentation. Extract all non-presentation logic.

**Categories of logic to extract:**

- **Business Logic** → Utility Functions
- **Calculations** → Helper Functions
- **Data Transformations** → Utility Functions
- **API/External Integration** → Services

**Benefits of extraction:**

- Easier to test (pure functions are testable)
- Reusable across components
- Better separation of concerns
- Easier to optimize independently

---

### 4. Mandatory Documentation

**RULE:** All utility functions, exported functions, and complex logic MUST have JSDoc comments.

**Required JSDoc elements:**

````typescript
/**
 * Brief description of what the function does (one line).
 *
 * More detailed explanation if needed. Explain the WHY, not just the WHAT.
 * Mention any side effects, caveats, or important behaviors.
 *
 * @param param_name - Description of parameter
 * @param optional_param - Description (optional parameter)
 * @returns Description of return value
 *
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * ```ts
 * const result = my_function('example', 42);
 * console.log(result); // Expected output
 * ```
 *
 * @see {@link RelatedFunction} for related functionality
 * @see {@link RelatedType} for the type structure
 */
export function my_function(param_name: string, optional_param?: number): Result {
    // implementation
}
````

**Minimum requirements:**

- Description of purpose
- All `@param` documented
- `@returns` documented (if not void)
- At least one `@example` for non-trivial functions

**Additional documentation for:**

- Complex algorithms → Add step-by-step explanation
- Performance-critical code → Document time/space complexity
- Workarounds → Explain WHY the workaround is needed
- Non-obvious behavior → Explain edge cases

---

### 5. DRY Principle - Don't Repeat Yourself

**RULE:** If you write the same logic twice, extract it on the third use.

**Common patterns to extract:**

- Form Validation → Shared composables
- Node/Connection Lookups → Utility functions
- Toast Messages → Message factory functions
- Component Patterns → Reusable components

---

### 6. Performance - Optimize Smartly

**RULE:** Avoid unnecessary re-renders and expensive calculations.

**Optimization patterns:**

- Use `$derived` for computed values
- Cache expensive data structures (e.g., Maps for lookups)
- Debounce user input
- Avoid array methods in loops (use Maps for O(1) lookups)

**Performance guidelines:**

- Profile before optimizing (measure, don't guess)
- Optimize hot paths first
- Document performance trade-offs
- Add performance tests for critical paths

---

### 7. Testing Requirements

**RULE:** All extracted utilities and complex components must have tests.

**Minimum test coverage:**

- **Utility Functions**: 90% coverage minimum
- **Store Methods**: 80% coverage minimum
- **Components with Logic**: 70% coverage minimum
- **UI-Only Components**: Visual regression tests

**Test type patterns:**

- **Unit Tests** → For pure utility functions
- **Component Tests** → For user interactions
- **Integration Tests** → For complete flows

---

### 8. Naming Conventions

**RULE:** Names must be clear, descriptive, and follow project conventions.

**Naming patterns:**

- **Be explicit, not clever** → Use clear, descriptive names over abbreviations
- **Boolean variables should be questions** → `is_loading`, `has_errors`, `can_submit`
- **Function names should be actions** → `create_node()`, `validate_form()`, `handle_submit()`
- **Use consistent terminology** → Don't mix terms like 'statement' and 'node'

---

### 9. Code Organization

**RULE:** Follow consistent file organization patterns.

**Directory structure:**

```
src/lib/
├── components/          # UI components
│   ├── graph/          # Graph-specific components
│   ├── panels/         # Panel components
│   │   └── ComponentName/  # Complex component directory
│   │       ├── index.ts
│   │       ├── ComponentName.svelte
│   │       └── SubComponent.svelte
│   └── ui/             # Reusable UI components
├── stores/             # Svelte stores
│   └── *.svelte.ts     # Store files
├── types/              # Type definitions
│   ├── graph.ts        # Graph types
│   ├── ui.ts           # UI types
│   └── d3-extensions.ts # D3 type extensions
├── utils/              # Utility functions
│   ├── graph-helpers.ts
│   ├── validation.ts
│   └── d3/             # D3-specific utilities
│       ├── simulation.ts
│       └── rendering.ts
└── services/           # External integrations
```

**File organization rules:**

- One primary export per file
- Group related utilities in directories
- Use `index.ts` barrel exports for directories
- Keep flat structure where possible

**Import order:**

```typescript
// 1. External dependencies
import { onMount } from 'svelte';
import * as d3 from 'd3';

// 2. Internal stores
import { graph_store } from '$lib/stores/graph.svelte';

// 3. Internal components
import Button from '$lib/components/ui/Button.svelte';

// 4. Internal utilities
import { validate_form } from '$lib/utils/validation';

// 5. Types
import type { LogicNode } from '$lib/types/graph';
```

---

### 10. Refactoring Triggers

**RULE:** Refactor when you see these warning signs.

**Immediate refactoring required:**

- **Component > 150 lines** → Split immediately
- **Function > 50 lines** → Extract sub-functions
- **Using `any` type** → Create proper types
- **Same code in 3+ places** → Extract to utility
- **Nested callbacks > 3 levels** → Extract functions
- **Test file > 500 lines** → Split into multiple test files

**Plan refactoring soon:**

- **Component 100-150 lines** → Consider splitting
- **Function 30-50 lines** → Consider extracting
- **Same code in 2 places** → Watch for third use
- **Complex conditionals** → Extract to named functions
- **Long parameter lists** → Use config objects

**Best practices:**

- **Component < 100 lines** → Good
- **Function < 30 lines** → Good
- **No code duplication** → Excellent
- **Clear separation of concerns** → Excellent
- **Comprehensive tests** → Excellent

---

## Summary Checklist

Before committing code, verify:

- [ ] No component exceeds line limits
- [ ] No `any` types used
- [ ] All logic extracted from components
- [ ] All utilities have JSDoc comments
- [ ] No duplicated code
- [ ] Performance optimizations applied
- [ ] Tests written for new code
- [ ] Names are clear and consistent
- [ ] Files organized correctly
- [ ] No refactoring triggers present

**When in doubt:**

- Favor clarity over cleverness
- Favor explicit over implicit
- Favor separation over integration
- Favor testability over convenience

---

**Remember:** Tech debt is easier to prevent than to fix. Following these rules saves time in the long run.
