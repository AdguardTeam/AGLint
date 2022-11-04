&nbsp;
<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="assets/aglint_darkmode.svg">
        <img alt="AGLint" src="assets/aglint_lightmode.svg" width="300px">
    </picture>
</p>
<h3 align="center">Universal adblock filter list parser, linter and converter.</h3>
<p align="center">
    Supported syntaxes:
</p>
<p align="center">
    <a href="https://adguard.com/"><img src="https://gist.githubusercontent.com/scripthunter7/6378a96b61b927357f39a33d3abc5af7/raw/e306604fd548ac1b2de70d2a5d8a43017496f221/adguard_logo.svg" width="14px"> AdGuard</a> |
    <a href="https://github.com/gorhill/uBlock"><img src="https://upload.wikimedia.org/wikipedia/commons/0/05/UBlock_Origin.svg" width="14px"> uBlock Origin</a> |
    <a href="https://adblockplus.org/"><img src="https://upload.wikimedia.org/wikipedia/commons/9/9b/Adblock_Plus_2014_Logo.svg" width="14px"> Adblock Plus</a>
</p>

Table of Contents:
- [Project structure](#project-structure)
  - [Parser](#parser)
  - [Converter (WIP)](#converter-wip)
  - [Linter (WIP)](#linter-wip)
- [References](#references)

## Project structure

### Parser

- Parsing ADG/UBO/ABP rules into AST (string &#8594; AST)
- Tolerant
- Filter out syntax errors
- Serialize rules (AST &#8594; string)

#### Parser example

This code:

```typescript
import { RuleParser } from "aglint/parser";

const ast = RuleParser.parse("example.com,~example.net#%#//scriptlet('prevent-setInterval', 'check', '!300')");
```

will gives you this AST:

```json
{
    "category": "Cosmetic",
    "type": "ScriptletRule",
    "syntax": "AdGuard",
    "exception": false,
    "modifiers": [],
    "domains": [
        {
            "domain": "example.com",
            "exception": false
        },
        {
            "domain": "example.net",
            "exception": true
        }
    ],
    "separator": "#%#//scriptlet",
    "body": {
        "scriptlets": [
            {
                "scriptlet": {
                    "type": "SingleQuoted",
                    "value": "prevent-setInterval"
                },
                "parameters": [
                    {
                        "type": "SingleQuoted",
                        "value": "check"
                    },
                    {
                        "type": "SingleQuoted",
                        "value": "!300"
                    }
                ]
            }
        ]
    }
}
```

Then, you can serialize this AST:
```typescript
RuleParser.generate(ast);
```

Which returns the rule as string:
```adblock
example.com,~example.net#%#//scriptlet('prevent-setInterval', 'check', '!300')
```

#### Another parser example

> *Please note that unnecessary spaces will disappear and CSS selectors will be regenerated according to uniform formatting*

```typescript
import { RuleParser } from "aglint/parser";

// General rules (ADG/uBO/ABP)
console.log(RuleParser.generate(RuleParser.parse("##.ad")));
console.log(RuleParser.generate(RuleParser.parse("##.ad:-abp-has(> .something)")));
console.log(RuleParser.generate(RuleParser.parse("-banner-350px-")));
console.log(RuleParser.generate(RuleParser.parse("/ad.js$script,third-party")));

// AdGuard-specific rules:
console.log(RuleParser.generate(RuleParser.parse("!+ NOT_OPTIMIZED PLATFORM(windows, mac)")));
console.log(RuleParser.generate(RuleParser.parse("!+ NOT_OPTIMIZED PLATFORM( windows, mac )")));
console.log(RuleParser.generate(RuleParser.parse("[$app=com.apple.Safari]example.org#%#//scriptlet('prevent-setInterval', 'check', '!300')")));
console.log(RuleParser.generate(RuleParser.parse("example.com,~example.net#@$?#@media (min-width: 1024px) { body:-abp-has(.ad) { padding: 0; } }")));
console.log(RuleParser.generate(RuleParser.parse("!#if (adguard)")));
console.log(RuleParser.generate(RuleParser.parse(`@@||example.org^$replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/v\\$1<\\/VAST>/i`)));

// uBlock-specific rules:
console.log(RuleParser.generate(RuleParser.parse("example.com,~example.net##:matches-path(/path) .ad")));
console.log(RuleParser.generate(RuleParser.parse("example.com,~example.net#@#:matches-path(/path) body:style(padding: 0;)")));
console.log(RuleParser.generate(RuleParser.parse("example.com##^script:has-text(something)")));
console.log(RuleParser.generate(RuleParser.parse("example.com##+js(scriptlet0, , arg0)")));

// Adblock Plus specific rules:
console.log(RuleParser.generate(RuleParser.parse("example.com#$#scriptlet1 arg0 arg1")));
console.log(RuleParser.generate(RuleParser.parse("example.com#$#scriptlet1 arg0\\ arg0 arg1; scriptlet2;   scriptlet3;")));
```

### Converter (WIP)
- Compatibility tables
- Rule converter (AST &#8594; AST) 

### Linter (WIP)
- Validate rules
- Check redundancies, conflicts

## References

- Basic docs:
  - ADG _How to create your own ad filters_: https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters
  - uBO _Static filter syntax_: https://github.com/gorhill/uBlock/wiki/Static-filter-syntax
  - ABP _How to write filters_: https://help.eyeo.com/adblockplus/how-to-write-filters
- (Extended) CSS:
  - MDN _CSS selectors_: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
  - ADG _Extended CSS capabilities_: https://github.com/AdguardTeam/ExtendedCss/blob/master/README.md#extended-capabilities
  - uBO _Procedural cosmetic filters_: https://github.com/gorhill/uBlock/wiki/Procedural-cosmetic-filters
  - ABP _Extended CSS selectors_: https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide-emulation
- Scriptlets:
  - ADG scriptlets: https://github.com/AdguardTeam/Scriptlets/blob/master/wiki/about-scriptlets.md#scriptlets
  - uBO scriptlets: https://github.com/gorhill/uBlock/wiki/Resources-Library#available-general-purpose-scriptlets
  - ABP snippets: https://help.eyeo.com/adblockplus/snippet-filters-tutorial#snippets-ref
- Third party libraries:
  - CSSTree: https://github.com/csstree/csstree/tree/master/docs
