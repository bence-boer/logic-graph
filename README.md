# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Editor & formatting

This repository uses Prettier and ESLint for formatting and linting. Important notes about editor integration:

- Format-on-save and automatic organize-imports on save are disabled in the workspace settings. This prevents unexpected edits when saving files.
- Use the explicit commands when you want to format or fix issues:
    - Run `npm run format` to apply Prettier to the entire repo.
    - Run `npm run lint:fix` to run Prettier and ESLint --fix across the repo.
- Pre-commit hooks (Husky + lint-staged) run Prettier and `eslint --fix` on staged files to keep commits tidy.

If you prefer format-on-save, you can re-enable it in your local VS Code settings, but the project defaults to manual formatting and pre-commit enforcement.
