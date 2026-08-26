<!-- markdownlint-disable -->
# Rules

| Name | Description | Recommended | Has autofix | Has suggestions |
| --- | --- | :---: | :---: | :---: |
| [if-directive-balance](./if-directive-balance.md) | Checks if conditional preprocessor directives are structured correctly | ✅ | 🔧 |  |
| [max-css-selectors](./max-css-selectors.md) | Checks if a CSS selector list contains more than the specified number of selectors |  | 🔧 |  |
| [no-css-comments](./no-css-comments.md) | Disallows CSS comments | ✅ | 🔧 |  |
| [no-duplicated-css-declaration-props](./no-duplicated-css-declaration-props.md) | Checks for duplicated CSS declaration properties within the same rule block | ✅ | 🔧 | 💡 |
| [no-duplicated-hint-platforms](./no-duplicated-hint-platforms.md) | Checks if a platform is used more than once within the same PLATFORM / NOT_PLATFORM hint | ✅ | 🔧 |  |
| [no-duplicated-hints](./no-duplicated-hints.md) | Checks if hints are duplicated within the same hint comment rule | ✅ |  |  |
| [no-duplicated-modifiers](./no-duplicated-modifiers.md) | Checks if a network rule contains multiple same modifiers | ✅ |  |  |
| [no-excluded-rules](./no-excluded-rules.md) | Checks if any rule matches an excluded pattern |  | 🔧 |  |
| [no-inconsistent-hint-platforms](./no-inconsistent-hint-platforms.md) | Checks if a platform targeted by a PLATFORM() hint is also excluded by a NOT_PLATFORM() hint at the same time | ✅ |  |  |
| [no-invalid-css-declaration](./no-invalid-css-declaration.md) | Checks if CSS declarations are valid | ✅ |  |  |
| [no-invalid-domains](./no-invalid-domains.md) | Disallows invalid domains | ✅ |  | 💡 |
| [no-invalid-hint-params](./no-invalid-hint-params.md) | Checks if hints are parameterized correctly | ✅ |  |  |
| [no-invalid-modifiers](./no-invalid-modifiers.md) | Checks modifiers validity for basic (network) rules | ✅ |  |  |
| [no-invalid-scriptlets](./no-invalid-scriptlets.md) | Checks if scriptlets are valid based on compatibility tables |  |  | 💡 |
| [no-short-rules](./no-short-rules.md) | Checks if a rule is too short | ✅ |  |  |
| [no-unknown-hint-platforms](./no-unknown-hint-platforms.md) | Checks if platforms in related hints are known | ✅ |  |  |
| [no-unknown-hints](./no-unknown-hints.md) | Checks if hints are known | ✅ |  |  |
| [no-unknown-preprocessor-directives](./no-unknown-preprocessor-directives.md) | Checks if a preprocessor directive is known | ✅ |  |  |
| [no-unsupported-css-pseudo-class](./no-unsupported-css-pseudo-class.md) | Checks that CSS pseudo-classes are supported | ✅ |  | 💡 |
| [scriptlet-quotes](./scriptlet-quotes.md) | Checks quotes in scriptlet |  | 🔧 |  |

Legend

| Emoji | Description |
| --- | --- |
| ✅ | Rule is enabled in `aglint:recommended` preset |
| 🔧 | Some or all problems reported by this rule can be fixed automatically |
| 💡 | Some or all problems reported by this rule can be fixed via suggestions |
