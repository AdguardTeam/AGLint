# Ignoring Files

AGLint allows you to exclude files and directories from linting using `.aglintignore` files.
These files work similarly to `.gitignore` and can be placed in any directory within your project.

## Overview

The `.aglintignore` file tells AGLint which files and directories to skip during linting. This is useful for:

- Excluding third-party filter lists
- Ignoring build artifacts or temporary files
- Skipping test files or examples
- Avoiding sensitive or auto-generated content

## Basic Syntax

The `.aglintignore` file uses the same pattern syntax as `.gitignore`. Each line specifies a pattern:

```ignore
# Comments start with #
third-party/
*.backup.txt
dist
temp/
```

### Pattern Rules

- **Blank lines** are ignored
- **Comments** start with `#` and are ignored
- **Glob patterns** are supported (e.g., `*.txt`, `**/*.txt`)
- **Directory patterns** end with `/` to match directories only
- **Negation patterns** start with `!` to un-ignore previously ignored files

For detailed pattern syntax, see the [gitignore documentation](https://git-scm.com/docs/gitignore#_pattern_format).

## Hierarchical Behavior

AGLint supports multiple `.aglintignore` files at different directory levels. When checking if a file should be ignored:

1. AGLint walks up from the file's directory to the project root
2. It collects all `.aglintignore` files in the path
3. Patterns are applied from the directory where the `.aglintignore` file is located
4. Closer `.aglintignore` files take precedence over parent ones

### Example Structure

```text
project/
├── .aglintignore          # Root ignore file
├── filters/
│   ├── .aglintignore      # Filters-specific ignores
│   ├── main.txt
│   └── test.txt
└── scripts/
    └── build.txt
```

**Root `.aglintignore`:**

```ignore
third-party/
*.backup.txt
```

**`filters/.aglintignore`:**

```ignore
test.txt
dist
```

In this setup:

- `filters/test.txt` is ignored (matches pattern in `filters/.aglintignore`)
- `filters/main.txt` is linted
- `scripts/build.txt` is linted
- Any `*.backup.txt` files are ignored project-wide

## Common Patterns

### Ignore Specific Files

```ignore
# Ignore a specific file
filename.txt

# Ignore files in any directory
**/temp.txt
```

### Ignore File Types

```ignore
# Ignore backup filter lists
*.backup.txt
*.bak.txt

# Ignore temporary files
*.tmp.txt
*~
```

### Ignore Directories

```ignore
# Ignore entire directory
third-party/
dist/
temp/

# Ignore all directories with a specific name
**/cache/
```

### Negation Patterns

```ignore
# Ignore all .txt files
*.txt

# But don't ignore important.txt
!important.txt
```

## Integration with Configuration

Ignored files are filtered out **before** configuration resolution, which means:

- If a directory is ignored, its `.aglintrc` config files are also ignored
- Files explicitly passed as CLI arguments may still be ignored if they match patterns
- The ignore check happens during the file scanning phase

## Default Ignore Patterns

AGLint has built-in default ignore patterns that are always applied:

- `**/node_modules/**`
- `**/.git/**`
- `**/.hg/**`
- `**/.svn/**`
- `**/.DS_Store`
- `**/Thumbs.db`

These defaults are combined with your custom `.aglintignore` patterns. You don't need to add these
to your `.aglintignore` file.

## Examples

### Basic Project

**.aglintignore:**

```ignore
# Third-party filter lists
third-party/
vendor/

# Build output
dist/
build/

# Backup and temporary files
*.backup.txt
*.tmp.txt

# Test files
tests/
*.test.txt
```

### Multi-Directory Project

**Root `.aglintignore`:**

```ignore
# Global ignores
third-party/
*.backup.txt
temp/
```

**`src/.aglintignore`:**

```ignore
# Ignore generated files in src
generated/
*.generated.txt
```

**`examples/.aglintignore`:**

```ignore
# Ignore all example files except the main one
*
!main-example.txt
```

## Checking if Files are Ignored

When AGLint runs, it:

1. Scans for files matching the specified patterns (or default `**/*.{txt,adblock,adguard,ublock}`)
2. Builds the directory tree and loads all `.aglintignore` files
3. Filters out ignored files before linting
4. Reports only non-ignored files in the output

You can verify which files are being linted by running AGLint with verbose output
or checking the file count in the results.

## Notes

- `.aglintignore` files must be in UTF-8 encoding
- Patterns are relative to the directory containing the `.aglintignore` file
- Empty lines and comment-only lines are skipped
- Leading and trailing whitespace is trimmed from each line
- The ignore package is used internally for pattern matching (same as `.gitignore`)
