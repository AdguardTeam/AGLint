# Integrate AGLint to your GitHub repository

Table of contents:
- [Integrate AGLint to your GitHub repository](#integrate-aglint-to-your-github-repository)
  - [Pre-requisites](#pre-requisites)
  - [1. Initialize the project](#1-initialize-the-project)
  - [2. Install AGLint](#2-install-aglint)
    - [`.gitignore`](#gitignore)
  - [3. Create a configuration file](#3-create-a-configuration-file)
  - [4. Add AGLint to scripts (optional)](#4-add-aglint-to-scripts-optional)
  - [5. Add AGLint to CI (optional)](#5-add-aglint-to-ci-optional)
  - [6. Create a pre-commit hook with Husky (optional)](#6-create-a-pre-commit-hook-with-husky-optional)

If you have a GitHub repository for adblock filters, you can integrate AGLint to your repository. In this document, we'll help you to do that.

## Pre-requisites

You'll need to have the following tools installed on your computer:
- [Node.js](https://nodejs.org/en/) (version 14 or higher, we recommend the latest LTS version). Node.js comes with npm (Node Package Manager), so you don't need to install it separately.
- [Git](https://git-scm.com/)

## 1. Initialize the project

If you don't have `package.json` file in your repository, you'll need to initialize it. To do that, run the following command in your repository's root directory:

```bash
npm init -y
```

If you already have `package.json` file, just skip this step.

## 2. Install AGLint

To install AGLint, run the following command in your repository directory:

```bash
npm install -D @adguard/aglint
```

This will install AGLint and add it to the `package.json` file under `devDependencies` section. `-D` is a shortcut for `--save-dev`, which will add AGLint to `package.json` file under `devDependencies` section.

### `.gitignore`

If you don't have `package.json` file in your repository before installing, it is highly recommended to create a `.gitignore` file and add `node_modules` to it. To do that, run the following command in your repository's root directory:

```bash
echo node_modules > .gitignore
```

otherwise, `node_modules` directory will be added to the version control, which is a bad practice.

## 3. Create a configuration file

AGLint needs a configuration file to work. You can generate a basic configuration file by running the following command in your repository directory:

```bash
npx aglint init
```

This will create a file named `.aglintrc.yaml` in your repository directory. You can edit this file to customize the configuration.

Now you can run AGLint by running the following command in your repository's root directory:

```bash
npx aglint
```

## 4. Add AGLint to scripts (optional)

For simplicity, you can add AGLint to your `package.json` file under `scripts` section. You can use the following command to do that:

```bash
npm pkg set scripts.lint="aglint"
```

Now you can also run AGLint by running the following command:

```bash
npm run lint
```

because `npm run` will run the script named `lint` in `scripts` section of `package.json` file.

## 5. Add AGLint to CI (optional)

If you want to check commits and pull requests automatically on GitHub, you can add AGLint to your CI. You can create a GitHub Actions workflow file named `.github/workflows/aglint.yml` with the following content:

```yaml
# Sample workflow to run AGLint on GitHub Actions
name: AGLint

# Change the Node.js version if you want
env:
  NODE_VERSION: 20

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
  pull_request:
    branches:
      # TODO: If your default branch is not "main", you should
      # change this to your default branch name, for example: "master"
      - main
    paths:
      - "**/*.txt"

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

Now AGLint will run on push to main branch and on pull requests to `main` branch, but only if the changed files contain `.txt` files. You can customize this workflow file to fit your needs. Results of AGLint will be shown in the "Checks" tab of the pull request page and in the "Actions" tab of the repository page.

If you want to skip AGLint on a push or pull request, you can add `[skip ci]` to the commit message or pull request title.

You can check the [GitHub Actions documentation](https://docs.github.com/en/actions) for more information.

## 6. Create a pre-commit hook with Husky (optional)

If you want to check commits automatically, you can add AGLint to your pre-commit hook. This will run AGLint before each commit and will prevent you from committing if the linter found any errors. To do that, you can install [Husky](https://www.npmjs.com/package/husky) with the following command:

```bash
npm install -D husky
```

(`-D` is a shortcut for `--save-dev`, which will add Husky to `package.json` file under `devDependencies` section.)

After installing Husky dependency, you'll need to add a `prepare` script to your `package.json` file by running the following command:

```bash
npm pkg set scripts.prepare="husky install"
```

This will install Husky when you run `npm install` after re-cloning the repository, but for now you'll need to run the following command to install Husky:

```bash
npm run prepare
```

Finally, you can add AGLint to your pre-commit hook by running the following commands:

```
npx husky add .husky/pre-commit "npm run lint"
git add .husky/pre-commit
```

Now AGLint will run before each commit and will prevent you from committing if AGLint found any errors, but you can skip AGLint by adding `--no-verify` to your commit command.

Next time you clone the repository, you'll only need to run `npm install` and it will install Husky automatically, because it automatically runs `prepare` script after installing dependencies.
