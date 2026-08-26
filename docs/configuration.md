# Configuration

AGLint requires a configuration file to work. If you don't have a configuration file, the CLI will throw an error and
ask you to create one.

## Create a configuration file

If you don't have a configuration file, you can create it by running `aglint init`
**in the root directory of your project.** This command will launch an interactive wizard that will guide you
through the process and create a configuration file in the current directory.

You can also create a configuration file manually, please check the section below for more info.

### Configuration file name and format

Configuration file is a JSON or YAML file that contains the configuration for the linter and should be named as one of
the following:

- `aglint.config.json` (JSON)
- `aglint.config.yaml` (YAML)
- `aglint.config.yml` (YAML)
- `.aglintrc` (JSON) *- not recommended, no file extension*
- `.aglintrc.json` (JSON)
- `.aglintrc.yaml` (YAML)
- `.aglintrc.yml` (YAML)

We also plan to support `.aglintrc.js` (JavaScript) in the future.

We recommend using `.aglintrc.yaml` or `.aglintrc.yml` because YAML is more compact and easier to read, and it supports
comments.

> [!WARNING]
> If you have multiple configuration files in the same directory, the CLI will throw an error and ask you
> to fix it.

> [!WARNING]
> If your configuration file is syntactically invalid or contains unknown / invalid options, the CLI will
> throw an error and ask you to fix it.

> [!WARNING]
> If your configuration file is not named in one of the ways listed above, the CLI will ignore it (since it
> cannot recognize it as a configuration file).

### Configuration file structure

The configuration file should be a valid JSON or YAML file. The following options are available:

- `root` — defaults to `false`, flag that indicates
  whether the current configuration is the main config configuration which can be enabled by `true` value;
  otherwise the linter will search for the configuration in parent directories.
- `syntax` — array of strings, specifies the syntax of the filter lists.
  If there is an `Agent` type comment in a filter list, the linter will use the syntax specified in the comment.
  If not set, parsed by AGTree `syntax` value will be used.
  Possible values:
    - `Common` — Common filter list syntax (default);
    - `AdGuard` — AdGuard filter list syntax;
    - `UblockOrigin` — uBlock filter list syntax;
    - `AdblockPlus` — Adblock Plus filter list syntax.
- `allowInlineConfig` — enable or disable inline config comments, e.g. `! aglint-disable-next-line`;
  defaults to `true`.
- `extends` — an array of configuration presets to extend, e.g. `["preset-1", "preset-2"]`.
  See [Configuration presets](#configuration-presets) for more info.
  Defaults to `[]`, i.e. no presets.
  Preset's syntax and rules can be overridden by the user config.
- `rules` — an object with configured [linter rules](./rules/README.md)
  according to [configuration rule structure](#configuration-rule-structure).

#### <a name="configuration-rule-structure"></a> Configuration rule structure

A rule basically has the following structure:

<!-- TODO: use real rules as an examples -->
- the key is the name of the rule, e.g. `rule-1`;
- the value is the severity and the configuration of the rule,
  e.g. `"error"` or `["error", { "option-1": "value-1" }]`.
    - The severity always must be specified.
      If the rule doesn't have any configuration, you can use a string with the severity, e.g. `"error"`.
      Severity codes may also be used instead of severity names.
      Default rule severity depends on the rule and may differ from rule to rule.
      Possible values:
        - `off` or `0` — nothing will be reported;
          the linter rule does not run its checks which means less resource usage;
        - `warn` or `1` — reports a warning (deprecated syntax, formatting issues, redundant rules, etc.);
        - `error` or `2` — reports an error (unknown scriptlets, unknown modifiers, invalid syntax, etc.).
    - If the rule has configuration, you must use an array with two elements.
      The first element is the severity and the rest of the elements are the configuration,
      e.g. `["error", { "option-1": "value-1" }]`.

##### Examples

You can disable the `rule-1` rule by adding the following configuration:

```json
{
    "rules": {
        "rule-1": "off"
    }
}
```

but an array also can be used as well:

```json
{
    "rules": {
        "rule-1": ["off"]
    }
}
```

You can change the severity of the `rule-2` rule to `warn`:

```json
{
    "rules": {
        "rule-2": ["warn"]
    }
}
```

or change the severity of the `rule-3` rule to `error` and add a configuration for it:

```json
{
    "rules": {
        "rule-3": ["error", { "option-3": "value-3" }]
    }
}
```

### Configuration presets

Configuration presets are basically configuration files that you can use to extend in your configuration.
Currently, there are two built-in presets available (click on the name to see the source code):

- [`aglint:recommended`][aglint-recommended] — a set of recommended rules that are enabled by default.
  It is enough to use this preset in most cases.
- [`aglint:all`][aglint-all] — a set of **all** rules that are available in the linter.
  This option maybe too strict for most projects.

> [!NOTE]
> Presets contain `syntax` and `rules` which shall be overridden if they are specified in the config.

> [!NOTE]
> All presets have `syntax` property set to `Common` a default value.
> You may need to specify it in your [configuration file](#configuration-file-structure)
> for better linting, e.g. modifiers validation.

> [!NOTE]
> We are planning to add more presets in the future,
> and also allow users to create their own presets but currently it is not possible.

### Default configuration file

This configuration file is similar to what is created by the `aglint init` command.
It simply extends the `aglint:recommended` preset and specifies the `root` option.

- YAML syntax — `.aglintrc.yaml`:

    ```yaml
    # AGLint config file
    # Documentation: https://github.com/AdguardTeam/AGLint/docs/configuration.md
    root: true
    extends:
        - aglint:recommended
    syntax:
        - Common
    ```

- JSON syntax — `.aglintrc.json`:

    ```json
    {
        "root": true,
        "extends": [
            "aglint:recommended"
        ],
        "syntax": [
            "Common"
        ]
    }
    ```

> [!NOTE]
> JavaScript configuration files aren't supported at the moment
> but we plan to add support for them in the future (CJS and ESM syntaxes).

### Configuration cascading and hierarchy

AGLint follows the same configuration file search algorithm as ESLint ([learn more][eslint-config-hierarchy]), so if you
are familiar with ESLint, this section will be easy to understand.

If you call AGLint in a directory (lets call it current directory / current working directory), it will search for a
configuration file in this directory and all parent directories until it finds one configuration file with the `root`
option set to `true` or reaches the root directory (the most top directory, which doesn't have a parent directory). If
the linter doesn't find any configuration file at all, it will throw an error and ask you to fix it, because it cannot
work without a configuration file.

If the linter finds multiple configuration files in the same directory, it will also throw an error and ask you to fix
it, because it is an inconsistent state, since the linter doesn't know which configuration file to use. ESLint uses a
[name-based priority system][eslint-config-file-formats] to resolve this issue, but AGLint throws an error instead, to
keep things simple and clear.

#### Why the `root` option is important

Suppose you store your projects in the `my-projects` directory, and you have the following directory structure:

```txt
my-projects
├── .aglintrc.yaml
├── project-1
│   ├── dir1
│   │   ├── list1.txt
│   │   ├── list2.txt
│   ├── dir2
│   │   ├── .aglintrc.yaml
│   │   ├── dir3
│   │   │   ├── list3.txt
│   │   │   ├── list4.txt
│   ├── list5.txt
│   ├── .aglintrc.yaml
├── project-2
│   ├── ...
├── ...
```

As you can see, the `my-projects` directory contains a configuration file, and the `project-1` directory also contains
some configuration files.

Let's assume that `my-projects/project-1/.aglintrc.yaml` doesn't have the `root` option set to `true`.

If you call AGLint in the `project-1` directory, it finds the configuration file in the `project-1`, but since it
doesn't specify the `root` property, therefore the linter will continue to search for a configuration file in the parent
directories. As a result, it will find the configuration file in the `my-projects` directory and merge these two
configuration files into one configuration. This is a bad practice, since if you move your project to another directory,
linting results may change, because `my-projects/.aglintrc` loses its effect. Projects should be handled as a single
unit, and the `root` option is designed to solve this problem. If you set the `root` option to `true` in the
configuration file from the `project-1` directory, the linter will stop searching for configuration files right after it
finds the configuration file from the `project-1` directory, and will ignore the configuration file from the
`my-projects` directory. This is how the `root` option works and why it is important.

However, merging configurations is useful within a single project, so if you specify the main configuration in your
project's root directory, but if you want to override some rules in some subdirectories, you can do it by creating a
configuration file in this subdirectory. For example, if you want to disable the `rule-1` rule in the `dir2` directory,
you can create the following configuration file in the `dir2` directory:

```yaml
# project-1/dir2/.aglintrc.yaml
rules:
  rule-1: "off"
```

And of course, at the top of this hierarchy, you can specify inlined configuration comments
in your adblock filter list files, which will override the configuration from the configuration files
but only if `allowInlineConfig` option is enabled.

[aglint-all]: https://github.com/AdguardTeam/AGLint/blob/master/src/linter/config-presets/aglint-all.ts
[aglint-recommended]: https://github.com/AdguardTeam/AGLint/blob/master/src/linter/config-presets/aglint-recommended.ts
[eslint-config-file-formats]: https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file-formats
[eslint-config-hierarchy]: https://eslint.org/docs/latest/use/configure/configuration-files#cascading-and-hierarchy
