# Modifiers compatibility tables

Each file represents a specific modifier. The file name is the name of the modifier. For example, `third-party` is represented by the file `third-party.yml`.

## File structure

Each file contains an object, where the key is the [actual adblocker ID](../README.md#supported-adblockers-and-platforms) and the value is the object with the following fields:

| Field | Description | Type | Default value |
| --- | --- | --- | --- |
| `modifier`\* | Name of the actual modifier. | `string` | |
| `aliases` | List of aliases for the modifier. | `string[]` | `[]` (no aliases) |
| `conflicts` | List of modifiers that are incompatible with the actual one. | `string[]` | `[]` (no conflicts) |
| `single` | The actual modifier can only be used alone, it cannot be combined with any other modifiers. | `boolean` | `false` |
| `assignable` | Describes whether the actual modifier supports value assignment. For example, `domain` is assignable, so it can be used like this: `$domain=domain.com\|~subdomain.domain.com`, where `=` is the assignment operator and `domain.com\|~subdomain.domain.com` is the value. | `boolean` | `false` |
| `value_format` | Regular expression that matches the value of the actual modifier. If it's value is `null`, then the modifier value is not checked. | `string\|null` | `null` |
| `negatable` | Describes whether the actual modifier can be negated. For example, `third-party` is negatable, so it can be used like this: `~third-party`. | `boolean` | `true` |
| `block_only` | The actual modifier can only be used in blocking rules, it cannot be used in exceptions. If it's value is `true`, then the modifier can be used only in blocking rules. `exception_only` and `block_only` cannot be used together (they are mutually exclusive). | `boolean` | `false` |
| `exception_only` | The actual modifier can only be used in exceptions, it cannot be used in blocking rules. If it's value is `true`, then the modifier can be used only in exceptions. `exception_only` and `block_only` cannot be used together (they are mutually exclusive). | `boolean` | `false` |
| `version_added` | The version of the adblocker when the modifier was added. | `string` | `null` |
| `version_removed` | The version of the adblocker when the modifier was removed. | `string` | `null` |
| `docs` | Link to the documentation. If not specified or it's value is `null`, then the documentation is not available. | `string\|null` | `null` |
| `description` | Short description of the actual modifier. If not specified or it's value is `null`, then the description is not available. | `string\|null` | `null` |

\*: The field is required.
