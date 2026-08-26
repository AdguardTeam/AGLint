
# Inline comments

You may not want to lint some adblock rules, so you can add special inline comments to disable linting for a single
adblock rule or for the rest of the file. To do that, you need to add special comments to your adblock filter list,
which can be used to change the linter's behavior. Generally these "control comments" begin with the `! aglint` prefix.

> [!IMPORTANT]
> Inline configuration comments only work when `allowInlineConfig: true` is set in your configuration file.
> This option is enabled by default. If set to `false`, all inline comments will be ignored.

## Available Directives

- **`! aglint-disable-next-line`** - Disables linting for the immediately following line only
- **`! aglint-disable`** - Disables linting from this point until `! aglint-enable` or end of file
- **`! aglint-enable`** - Re-enables linting after a `! aglint-disable` directive
- **`! aglint`** - Changes rule configuration from this point forward until another `! aglint` or end of file

In the following sections you can find more info about these comments.

## Ignore adblock rules

### Ignore single adblock rule

You can completely disable linting for an adblock rule by adding `! aglint-disable-next-line` comment before the adblock
rule. For example, `example.com##.ad` will be ignored in the following case:

```adblock
! aglint-disable-next-line
example.com##.ad
example.net##.ad
```

This lets you disable linting for a single adblock rule, but it doesn't disable linting for the rest of the file. If you
want to disable linting for the rest of the file, you can add `! aglint-disable` comment before the first adblock rule
or add the file path to the ignore list in `.aglintignore` file.

### Ignore multiple adblock rules

If you want to ignore multiple adblock rules, you can add `! aglint-disable` comment before the first adblock rule and
`! aglint-enable` comment after the last adblock rule. For example, `example.com##.ad` and `example.net##.ad` will be
ignored in the following case:

```adblock
! aglint-disable
example.com##.ad
example.net##.ad
! aglint-enable
example.org##.ad
```

The `! aglint-disable` directive affects all subsequent lines until `! aglint-enable` is encountered or the end of file
is reached.
If you don't add `! aglint-enable`, all remaining rules in the file will be ignored.

### Disable some linter rules

In some cases, you may want to disable some linter rules for a single adblock rule or for multiple adblock rules.
When specifying multiple rule names, separate them with **commas**.

Here is how you can do it:

- **For a single adblock rule**: for example, `rule1` linter rule will be ignored for `example.com##.ad`
  in the following case (but it will be enabled for `example.net##.ad`):
  ```adblock
  ! aglint-disable-next-line rule1
  example.com##.ad
  example.net##.ad
  ```

- **For multiple specific rules on a single line**: use comma-separated rule names:
  ```adblock
  ! aglint-disable-next-line rule1, rule2, rule3
  example.com##.ad
  example.net##.ad
  ```

- **For multiple adblock rules**: for example, `rule1, rule2` linter rules will be ignored for `example.com##.ad` and
  `example.net##.ad` in the following case (but they will be enabled for `example.org##.ad`):
  ```adblock
  ! aglint-disable rule1, rule2
  example.com##.ad
  example.net##.ad
  ! aglint-enable rule1, rule2
  example.org##.ad
  ```

## Change linter rules configuration

In some cases, you may want to change the configuration of some linter rules during linting. Here is how you can do it:

```adblock
! aglint "rule-1": ["warn", { "option1": "value1" }], "rule-2": "off"
example.com##.ad
example.net##.ad
```

After the `! aglint` comment, you should specify the list of the rules that you want to change using JSON-like syntax.
When configuring multiple rules, separate them with **commas**. The configuration applies to all subsequent lines
until the end of the file or until the next `! aglint` comment.

The syntax is the same as in the [configuration file](./configuration.md).

## Unused Disable Directives

If you use the `--report-unused-disable-directives` CLI flag, AGLint will report disable directives
that don't actually suppress any problems. This helps keep your inline comments clean and meaningful.

The severity of these reports can be controlled with the `--unused-disable-directives-severity` CLI flag
(defaults to `"warn"`).
