<!-- markdownlint-disable -->
# `no-excluded-rules`

## Description

Checks if any rule matches an excluded pattern

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Automatic issue fixing

- Some reported problems can be fixed automatically 🔧

## Options

This rule can be configured using the following options.

### Options overview

```typescript
[
  {
    excludedRuleTexts: string | {
      pattern: string
      message?: string | undefined
    }[] // List of rule texts to exclude (string or {pattern, message})
    excludedRegExpPatterns: string | {
      pattern: string
      message?: string | undefined
    }[] // List of RegExp patterns to exclude (string or {pattern, message})
  }
]
```

### Options valibot schema

<details>
<summary>Click to expand</summary>

```typescript
{
  "kind": "schema",
  "type": "tuple",
  "expects": "Array",
  "async": false,
  "items": [
    {
      "kind": "schema",
      "type": "strict_object",
      "expects": "Object",
      "async": false,
      "entries": {
        "excludedRuleTexts": {
          "kind": "schema",
          "type": "array",
          "expects": "Array",
          "async": false,
          "item": {
            "kind": "schema",
            "type": "union",
            "expects": "(string | Object)",
            "async": false,
            "options": [
              {
                "kind": "schema",
                "type": "string",
                "expects": "string",
                "async": false,
                "~standard": {
                  "version": 1,
                  "vendor": "valibot"
                },
                "pipe": [
                  {
                    "kind": "schema",
                    "type": "string",
                    "expects": "string",
                    "async": false,
                    "~standard": {
                      "version": 1,
                      "vendor": "valibot"
                    }
                  },
                  {
                    "kind": "transformation",
                    "type": "transform",
                    "async": false
                  }
                ]
              },
              {
                "kind": "schema",
                "type": "strict_object",
                "expects": "Object",
                "async": false,
                "entries": {
                  "pattern": {
                    "kind": "schema",
                    "type": "string",
                    "expects": "string",
                    "async": false,
                    "~standard": {
                      "version": 1,
                      "vendor": "valibot"
                    }
                  },
                  "message": {
                    "kind": "schema",
                    "type": "optional",
                    "expects": "(string | undefined)",
                    "async": false,
                    "wrapped": {
                      "kind": "schema",
                      "type": "string",
                      "expects": "string",
                      "async": false,
                      "~standard": {
                        "version": 1,
                        "vendor": "valibot"
                      }
                    },
                    "~standard": {
                      "version": 1,
                      "vendor": "valibot"
                    }
                  }
                },
                "~standard": {
                  "version": 1,
                  "vendor": "valibot"
                }
              }
            ],
            "~standard": {
              "version": 1,
              "vendor": "valibot"
            }
          },
          "~standard": {
            "version": 1,
            "vendor": "valibot"
          },
          "pipe": [
            {
              "kind": "schema",
              "type": "array",
              "expects": "Array",
              "async": false,
              "item": {
                "kind": "schema",
                "type": "union",
                "expects": "(string | Object)",
                "async": false,
                "options": [
                  {
                    "kind": "schema",
                    "type": "string",
                    "expects": "string",
                    "async": false,
                    "~standard": {
                      "version": 1,
                      "vendor": "valibot"
                    },
                    "pipe": [
                      {
                        "kind": "schema",
                        "type": "string",
                        "expects": "string",
                        "async": false,
                        "~standard": {
                          "version": 1,
                          "vendor": "valibot"
                        }
                      },
                      {
                        "kind": "transformation",
                        "type": "transform",
                        "async": false
                      }
                    ]
                  },
                  {
                    "kind": "schema",
                    "type": "strict_object",
                    "expects": "Object",
                    "async": false,
                    "entries": {
                      "pattern": {
                        "kind": "schema",
                        "type": "string",
                        "expects": "string",
                        "async": false,
                        "~standard": {
                          "version": 1,
                          "vendor": "valibot"
                        }
                      },
                      "message": {
                        "kind": "schema",
                        "type": "optional",
                        "expects": "(string | undefined)",
                        "async": false,
                        "wrapped": {
                          "kind": "schema",
                          "type": "string",
                          "expects": "string",
                          "async": false,
                          "~standard": {
                            "version": 1,
                            "vendor": "valibot"
                          }
                        },
                        "~standard": {
                          "version": 1,
                          "vendor": "valibot"
                        }
                      }
                    },
                    "~standard": {
                      "version": 1,
                      "vendor": "valibot"
                    }
                  }
                ],
                "~standard": {
                  "version": 1,
                  "vendor": "valibot"
                }
              },
              "~standard": {
                "version": 1,
                "vendor": "valibot"
              }
            },
            {
              "kind": "metadata",
              "type": "description",
              "description": "List of rule texts to exclude (string or {pattern, message})"
            }
          ]
        },
        "excludedRegExpPatterns": {
          "kind": "schema",
          "type": "array",
          "expects": "Array",
          "async": false,
          "item": {
            "kind": "schema",
            "type": "union",
            "expects": "(string | Object)",
            "async": false,
            "options": [
              {
                "kind": "schema",
                "type": "string",
                "expects": "string",
                "async": false,
                "~standard": {
                  "version": 1,
                  "vendor": "valibot"
                },
                "pipe": [
                  {
                    "kind": "schema",
                    "type": "string",
                    "expects": "string",
                    "async": false,
                    "~standard": {
                      "version": 1,
                      "vendor": "valibot"
                    }
                  },
                  {
                    "kind": "validation",
                    "type": "min_length",
                    "async": false,
                    "expects": ">=1",
                    "requirement": 1,
                    "message": "RegExp pattern cannot be empty"
                  },
                  {
                    "kind": "transformation",
                    "type": "transform",
                    "async": false
                  }
                ]
              },
              {
                "kind": "schema",
                "type": "strict_object",
                "expects": "Object",
                "async": false,
                "entries": {
                  "pattern": {
                    "kind": "schema",
                    "type": "string",
                    "expects": "string",
                    "async": false,
                    "~standard": {
                      "version": 1,
                      "vendor": "valibot"
                    }
                  },
                  "message": {
                    "kind": "schema",
                    "type": "optional",
                    "expects": "(string | undefined)",
                    "async": false,
                    "wrapped": {
                      "kind": "schema",
                      "type": "string",
                      "expects": "string",
                      "async": false,
                      "~standard": {
                        "version": 1,
                        "vendor": "valibot"
                      }
                    },
                    "~standard": {
                      "version": 1,
                      "vendor": "valibot"
                    }
                  }
                },
                "~standard": {
                  "version": 1,
                  "vendor": "valibot"
                },
                "pipe": [
                  {
                    "kind": "schema",
                    "type": "strict_object",
                    "expects": "Object",
                    "async": false,
                    "entries": {
                      "pattern": {
                        "kind": "schema",
                        "type": "string",
                        "expects": "string",
                        "async": false,
                        "~standard": {
                          "version": 1,
                          "vendor": "valibot"
                        }
                      },
                      "message": {
                        "kind": "schema",
                        "type": "optional",
                        "expects": "(string | undefined)",
                        "async": false,
                        "wrapped": {
                          "kind": "schema",
                          "type": "string",
                          "expects": "string",
                          "async": false,
                          "~standard": {
                            "version": 1,
                            "vendor": "valibot"
                          }
                        },
                        "~standard": {
                          "version": 1,
                          "vendor": "valibot"
                        }
                      }
                    },
                    "~standard": {
                      "version": 1,
                      "vendor": "valibot"
                    }
                  },
                  {
                    "kind": "transformation",
                    "type": "transform",
                    "async": false
                  }
                ]
              }
            ],
            "~standard": {
              "version": 1,
              "vendor": "valibot"
            }
          },
          "~standard": {
            "version": 1,
            "vendor": "valibot"
          },
          "pipe": [
            {
              "kind": "schema",
              "type": "array",
              "expects": "Array",
              "async": false,
              "item": {
                "kind": "schema",
                "type": "union",
                "expects": "(string | Object)",
                "async": false,
                "options": [
                  {
                    "kind": "schema",
                    "type": "string",
                    "expects": "string",
                    "async": false,
                    "~standard": {
                      "version": 1,
                      "vendor": "valibot"
                    },
                    "pipe": [
                      {
                        "kind": "schema",
                        "type": "string",
                        "expects": "string",
                        "async": false,
                        "~standard": {
                          "version": 1,
                          "vendor": "valibot"
                        }
                      },
                      {
                        "kind": "validation",
                        "type": "min_length",
                        "async": false,
                        "expects": ">=1",
                        "requirement": 1,
                        "message": "RegExp pattern cannot be empty"
                      },
                      {
                        "kind": "transformation",
                        "type": "transform",
                        "async": false
                      }
                    ]
                  },
                  {
                    "kind": "schema",
                    "type": "strict_object",
                    "expects": "Object",
                    "async": false,
                    "entries": {
                      "pattern": {
                        "kind": "schema",
                        "type": "string",
                        "expects": "string",
                        "async": false,
                        "~standard": {
                          "version": 1,
                          "vendor": "valibot"
                        }
                      },
                      "message": {
                        "kind": "schema",
                        "type": "optional",
                        "expects": "(string | undefined)",
                        "async": false,
                        "wrapped": {
                          "kind": "schema",
                          "type": "string",
                          "expects": "string",
                          "async": false,
                          "~standard": {
                            "version": 1,
                            "vendor": "valibot"
                          }
                        },
                        "~standard": {
                          "version": 1,
                          "vendor": "valibot"
                        }
                      }
                    },
                    "~standard": {
                      "version": 1,
                      "vendor": "valibot"
                    },
                    "pipe": [
                      {
                        "kind": "schema",
                        "type": "strict_object",
                        "expects": "Object",
                        "async": false,
                        "entries": {
                          "pattern": {
                            "kind": "schema",
                            "type": "string",
                            "expects": "string",
                            "async": false,
                            "~standard": {
                              "version": 1,
                              "vendor": "valibot"
                            }
                          },
                          "message": {
                            "kind": "schema",
                            "type": "optional",
                            "expects": "(string | undefined)",
                            "async": false,
                            "wrapped": {
                              "kind": "schema",
                              "type": "string",
                              "expects": "string",
                              "async": false,
                              "~standard": {
                                "version": 1,
                                "vendor": "valibot"
                              }
                            },
                            "~standard": {
                              "version": 1,
                              "vendor": "valibot"
                            }
                          }
                        },
                        "~standard": {
                          "version": 1,
                          "vendor": "valibot"
                        }
                      },
                      {
                        "kind": "transformation",
                        "type": "transform",
                        "async": false
                      }
                    ]
                  }
                ],
                "~standard": {
                  "version": 1,
                  "vendor": "valibot"
                }
              },
              "~standard": {
                "version": 1,
                "vendor": "valibot"
              }
            },
            {
              "kind": "metadata",
              "type": "description",
              "description": "List of RegExp patterns to exclude (string or {pattern, message})"
            }
          ]
        }
      },
      "~standard": {
        "version": 1,
        "vendor": "valibot"
      }
    }
  ],
  "~standard": {
    "version": 1,
    "vendor": "valibot"
  }
}
```

</details>

### Default options

```json
[
  {
    "excludedRuleTexts": [],
    "excludedRegExpPatterns": []
  }
]
```

## Correct examples

Examples of correct code:

### No excluded rules

The following code

```adblock
||example.com^
```

with the following rule config:

```json
[
  {
    "excludedRuleTexts": [],
    "excludedRegExpPatterns": []
  }
]
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### `||example.com^` rule is excluded

The following code

```adblock
||example.com^
||example.org^
```

with the following rule config:

```json
[
  {
    "excludedRuleTexts": [
      "||example.com^"
    ],
    "excludedRegExpPatterns": []
  }
]
```

should be reported as:

```shell
1:0 Rule matches an excluded rule text: ||example.com^
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,2 +1,1 @@
-||example.com^
 ||example.org^
```

### Rules containing `.org` are excluded

The following code

```adblock
||example.com^
||example.org^
```

with the following rule config:

```json
[
  {
    "excludedRuleTexts": [],
    "excludedRegExpPatterns": [
      "\\.org"
    ]
  }
]
```

should be reported as:

```shell
2:0 Rule matches an excluded pattern: /\.org/
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,2 +1,1 @@
 ||example.com^
-||example.org^
```

### Excluded rule with custom message (exact match)

The following code

```adblock
||example.com^
||example.org^
```

with the following rule config:

```json
[
  {
    "excludedRuleTexts": [
      {
        "pattern": "||example.com^",
        "message": "This rule is deprecated, please remove it"
      }
    ],
    "excludedRegExpPatterns": []
  }
]
```

should be reported as:

```shell
1:0 Rule matches an excluded rule text: ||example.com^ (This rule is deprecated, please remove it)
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,2 +1,1 @@
-||example.com^
 ||example.org^
```

### Excluded pattern with custom message

The following code

```adblock
||example.com^
||example.org^
```

with the following rule config:

```json
[
  {
    "excludedRuleTexts": [],
    "excludedRegExpPatterns": [
      {
        "pattern": "\\.org",
        "message": "Rules for .org domains are not allowed in this filter list"
      }
    ]
  }
]
```

should be reported as:

```shell
2:0 Rule matches an excluded pattern: /\.org/ (Rules for .org domains are not allowed in this filter list)
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,2 +1,1 @@
 ||example.com^
-||example.org^
```

## Version

This rule was added in AGLint version 2.0.10

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-excluded-rules.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-excluded-rules.test.ts
