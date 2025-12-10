#!/usr/bin/env node
/**
 * CLI entry point for AGLint.
 *
 * This file is intentionally minimal to make the CLI testable.
 * The main execution logic is in run-cli.ts, which can be imported and tested without
 * triggering immediate execution or dealing with process.exit().
 *
 * Responsibilities of this file:
 * - Import and call the main CLI function.
 * - Handle process.exit() based on the result.
 * - Serve as the executable entry point (#! Shebang).
 *
 * For testing the CLI logic, import and test runCli() from run-cli.ts instead.
 */

/* eslint-disable n/no-process-exit */

import { runCli } from './run-cli';

// Run CLI and exit with appropriate code
runCli().then((result) => {
    if (result.exitCode !== 0) {
        process.exit(result.exitCode);
    }
});
