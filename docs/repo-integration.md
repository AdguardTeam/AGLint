# Integrate AGLint to your GitHub repository

Table of contents:

- [Pre-requisites](#pre-requisites)
- [1. Initialize the project](#init-project)
- [2. Install AGLint](#install-aglint)
    - [`.gitignore`](#gitignore)
- [3. Create a configuration file](#create-config)
- [4. Add AGLint to scripts (optional)](#add-to-scripts)
- [5. Add AGLint to CI (optional)](#add-to-ci)
- [6. Use Husky hooks (optional)](#use-hooks)
    - [Add pre-commit hook](#pre-commit)
    - [Add post-merge hook](#post-merge)

If you have a GitHub repository for adblock filters, you can integrate AGLint to your repository. In this document,
we'll help you to do that.

## Pre-requisites

You'll need to have the following tools installed on your computer:

- [Node.js][nodejs] (version 14 or higher, we recommend the latest LTS version). Node.js comes with npm (Node Package
  Manager), so you don't need to install it separately.
- [Git][git]

## <a name="init-project"></a> 1. Initialize the project

If you don't have `package.json` file in your repository, you'll need to initialize it. To do that, run the following
command in your repository's root directory:

```bash
npm init -y
```

If you already have `package.json` file, just skip this step.

## <a name="install-aglint"></a> 2. Install AGLint

To install AGLint, run the following command in your repository directory:

```bash
npm install -D @adguard/aglint
```

This will install AGLint and add it to the `package.json` file under `devDependencies` section. `-D` is a shortcut for
`--save-dev`, which will add AGLint to `package.json` file under `devDependencies` section.

### `.gitignore`

If you don't have `package.json` file in your repository before installing, it is highly recommended to create a
`.gitignore` file and add `node_modules` to it. To do that, run the following command in your repository's root
directory:

```bash
echo node_modules > .gitignore
```

otherwise, `node_modules` directory will be added to the version control, which is a bad practice.

## <a name="create-config"></a> 3. Create a configuration file

AGLint needs a configuration file to work. You can generate a basic configuration file by running the following command
in your repository directory:

```bash
npx aglint init
```

This will create a file named `.aglintrc.yaml` in your repository directory. You can edit this file to customize the
configuration.

Now you can run AGLint by running the following command in your repository's root directory:

```bash
npx aglint
```

## <a name="add-to-scripts"></a> 4. Add AGLint to scripts (optional)

For simplicity, you can add AGLint to your `package.json` file under `scripts` section. You can use the following
command to do that:

```bash
npm pkg set scripts.lint="aglint"
```

Now you can also run AGLint by running the following command:

```bash
npm run lint
```

because `npm run` will run the script named `lint` in `scripts` section of `package.json` file.

## <a name="add-to-ci"></a> 5. Add AGLint to CI (optional)

If you want to check commits and pull requests automatically on GitHub, you can add AGLint to your CI. You can create a
GitHub Actions workflow file named `.github/workflows/aglint.yml` with the following content:

```yaml
# Sample workflow to run AGLint on GitHub Actions
name: AGLint

# Change the Node.js version if you want
env:
  NODE_VERSION: 18

# AGLint will run on every push and pull request to "main" branch,
# but only if the changed files contain .txt files
# If you use a different branch, replace "main" with your default
# branch name, for example: "master"
on:
  push:
    branches:
      # TODO: If your default branch is not "main", you should
      # change this to your default branch name, for example: "master"
      - main
    paths:
      - "**/*.txt"
      - ".aglintrc.*"
      - "package.json"
      - "package-lock.json"
  pull_request:
    branches:
      # TODO: If your default branch is not "main", you should
      # change this to your default branch name, for example: "master"
      - main
    paths:
      - "**/*.txt"
      - ".aglintrc.*"
      - "package.json"
      - "package-lock.json"

jobs:
  lint:
    name: Run AGLint
    runs-on: ubuntu-latest
    steps:
      - name: Check out to repository
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          # It is recommended to use cache to speed up the process,
          # especially if your repository receives a lot of pushes
          # and/or pull requests
          cache: npm

      - name: Install dependencies
        run: npm ci

      # If the linter found any errors, it will exit with a non-zero
      # code, which will cause the job to fail
      - name: Run AGLint
        run: npm run lint
```

Now AGLint will run on push to main branch and on pull requests to `main` branch, but only if the changed files contain
`.txt` files. You can customize this workflow file to fit your needs. Results of AGLint will be shown in the "Checks"
tab of the pull request page and in the "Actions" tab of the repository page.

If you want to skip AGLint on a push or pull request, you can add `[skip ci]` to the commit message or pull request
title.

You can check the [GitHub Actions documentation][github-actions-docs] for more information.

## <a name="use-hooks"></a> 6. Use Husky hooks (optional)

If you want to check commits automatically, you can add AGLint to your pre-commit hook. This will run AGLint before each
commit and will prevent you from committing if the linter found any errors. To do that, you can install [Husky][husky]
with the following command:

```bash
npm install -D husky
```

(`-D` is a shortcut for `--save-dev`, which will add Husky to `package.json` file under `devDependencies` section.)

After installing Husky dependency, you'll need to add a `prepare` script to your `package.json` file by running the
following command:

```bash
npm pkg set scripts.prepare="husky install"
```

This will install Husky when you run `npm install` after re-cloning the repository, but for now you'll need to run the
following command to install Husky:

```bash
npm run prepare
```

### <a name="pre-commit"></a> Add pre-commit hook

You can add AGLint to your pre-commit hook by running the following commands:

```bash
npx husky add .husky/pre-commit "npm run lint"
git add .husky/pre-commit
```

Now AGLint will run before each commit and will prevent you from committing if AGLint found any errors, but you can skip
AGLint by adding `--no-verify` to your commit command.

Next time you clone the repository, you'll only need to run `npm install` and it will install Husky automatically,
because it automatically runs `prepare` script after installing dependencies.

> [!NOTE]
> To make the hook work in Unix-like operating systems you may need to run
> `chmod ug+x .husky/pre-commit`.

### <a name="post-merge"></a> Add post-merge hook

If AGLint is updated on the remote repository (in practice, `package.json` or `package-lock.json` is changed on GitHub),
you need to update AGLint version in your local repository. If you just clone the changes, that does not sync your
dependencies in `node_modules` directory, so you need to run `npm install` to sync your dependencies manually.

> [!WARNING]
> If you do not sync your installed dependencies in your `node_modules` folder
> after the `package.json` or `package-lock.json` is changed,
> you may get errors when running AGLint or your CI may report different results than your local machine.

If you use Husky hooks, you can add a `post-merge` hook to automatically sync your dependencies after each merge.
This hook will run when you pull changes from the remote repository.

To add the `post-merge` hook run the following command:

```bash
npx husky add .husky/post-merge
```

After that, add the following content to your `.husky/post-merge` file:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# See https://git-scm.com/docs/githooks#_post_merge

# This function checks if a file has changed between the current HEAD and the previous HEAD
# Source: https://jshakespeare.com/use-git-hooks-and-husky-to-tell-your-teammates-when-to-run-npm-install
function changed {
    # HEAD@{1} is the original position of HEAD before the merge
    # HEAD is the new merge commit
    # --name-only only shows the names of the changed files
    # grep "^$1" only shows the files that match the first argument
    git diff --name-only HEAD@{1} HEAD | grep "^$1" > /dev/null 2>&1
}

# If package.json or package-lock.json is changed, we should sync local dependencies
if changed "package.json" || changed "package-lock.json"; then
    echo "package.json or package-lock.json changed, running npm install to sync dependencies"
    npm install
fi
```

This script will check if `package.json` or `package-lock.json` is changed between the old HEAD and the new HEAD.
If one of them is changed, it will run `npm install` to sync your dependencies, so you don't need to do that manually.

> [!NOTE]
> To make the hook work in Unix-like operating systems you may need to run
> `chmod ug+x .husky/post-merge`.


[git]: https://git-scm.com/
[github-actions-docs]: https://docs.github.com/en/actions
[husky]: https://www.npmjs.com/package/husky
[nodejs]: https://nodejs.org/en/
