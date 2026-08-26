# Contributing

You can contribute to the project by opening a pull request. People who contribute to AdGuard projects can receive
various rewards, see [this page][contribute] for details.

Please split your work into small, focused, and self-contained pull requests.

## Prerequisites

Ensure that the following software is installed on your computer:

- [Node.js][nodejs]: v22 (you can install multiple versions using [nvm][nvm])
- [pnpm][pnpm]: v10
- [Git][git]

> [!NOTE]
> For development, our team uses macOS and Linux. It may be possible that some commands not work on Windows,
> so if you are using Windows, we recommend using WSL or a virtual machine.

[git]: https://git-scm.com/
[nodejs]: https://nodejs.org/en/download
[nvm]: https://github.com/nvm-sh/nvm
[pnpm]: https://pnpm.io/installation

## Setup

Install dependencies:

```bash
pnpm install
```

### Available commands

During development, you can use the following commands (listed in `package.json`):

- `pnpm build` - build the library to the `dist` folder using [Rollup][rollup]
- `pnpm check-types` - check types with [TypeScript][typescript]
- `pnpm clean` - remove the `dist` folder
- `pnpm coverage` - print test coverage report
- `pnpm increment` - increment the version number (patch)
- `pnpm lint` - run all linters (types, TS, and Markdown)
- `pnpm lint:md` - lint Markdown files with [markdownlint][markdownlint]
- `pnpm lint:code` - lint code with [ESLint][eslint]
- `pnpm test` - run tests with [Vitest][vitest] (you can also run a specific test with `pnpm test <test-name>`)
- `pnpm rules:update` - regenerate rule exports, documentation, and presets

[contribute]: https://adguard.com/contribute.html
[eslint]: https://eslint.org/
[vitest]: https://vitest.dev/
[markdownlint]: https://github.com/DavidAnson/markdownlint
[rollup]: https://rollupjs.org/
[typescript]: https://www.typescriptlang.org/
