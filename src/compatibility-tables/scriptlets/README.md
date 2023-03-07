# Scriptlets compatibility tables

Each file represents a specific scriptlet. The file name is the name of the scriptlet. For example, `abort-on-property-read` is represented by the file `abort-on-property-read.yml`.

## File structure

Each file contains an object, where the key is the [actual adblocker ID](../README.md#supported-adblockers-and-platforms) and the value is the object with the following fields:

| Field | Description | Type | Default value |
| --- | --- | --- | --- |
| `scriptlet`\* | Name of the actual scriptlet. | `string` | |
| `aliases` | List of aliases for the scriptlet (if any). | `string[]` | `[]` (no aliases) |
| `description` | Short description of the actual scriptlet. If not specified or it's value is `null`, then the description is not available. | `string\|null` | `null` |
| `docs` | Link to the documentation. If not specified or it's value is `null`, then the documentation is not available. | `string\|null` | `null` |
| `version_added` | The version of the adblocker when the scriptlet was added. | `string` | `null` |
| `version_removed` | The version of the adblocker when the scriptlet was removed. | `string` | `null` |
| `debug` | Describes whether the scriptlet is used only for debugging purposes. | `boolean` | `false` |
| `parameters` | List of parameters that the scriptlet accepts. | `object[]` | `[]` (no parameters) |
| `parameters[].name`\* | Name of the parameter. | `string` | |
| `parameters[].required`\* | Describes whether the parameter is required. | `boolean` | |
| `parameters[].description` | Short description of the parameter. If not specified or it's value is `null`, then the description is not available. | `string\|null` | `null` |
| `parameters[].pattern` | Regular expression that matches the value of the parameter. If it's value is `null`, then the parameter value is not checked. | `string\|null` | `null` |
| `parameters[].default` | Default value of the parameter (if any) | `string` | `null` |
| `parameters[].debug` | Describes whether the parameter is used only for debugging purposes. | `boolean` | `false` |

\*: The field is required.
