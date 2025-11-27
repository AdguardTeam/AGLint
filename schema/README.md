# AGLint JSON Schema

This folder contains JSON Schema files for AGLint configuration files.

## Files

- **aglint-config.schema.json** - JSON Schema for AGLint configuration files (aglint.config.json, .aglintrc.json, etc.)

## Usage

### Visual Studio Code

Add the schema to your configuration file to get autocompletion and validation:

```json
{
  "$schema": "https://raw.githubusercontent.com/AdguardTeam/AGLint/main/schema/aglint-config.schema.json",
  "rules": {
    "no-short-rules": "error"
  }
}
```

Or configure it in your VS Code settings.json:

```json
{
  "json.schemas": [
    {
      "fileMatch": [
        "aglint.config.json",
        "aglint.config.yaml",
        "aglint.config.yml",
        ".aglintrc",
        ".aglintrc.json",
        ".aglintrc.yaml",
        ".aglintrc.yml"
      ],
      "url": "./node_modules/@adguard/aglint/schema/aglint-config.schema.json"
    }
  ]
}
```

### Other IDEs

Most modern IDEs support JSON Schema validation. Refer to your IDE's documentation for how to associate JSON files
with schemas.

## Generating the Schema

The schema is automatically generated from the Valibot schema defined in the source code.
To regenerate it:

```bash
pnpm schema:generate
```

This ensures the schema always stays in sync with the actual configuration validation logic.
