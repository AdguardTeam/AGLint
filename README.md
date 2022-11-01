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
- Filter out syntax errors
- Render rules as strings (AST &#8594; string)

Example:

```typescript
import { RuleParser } from "aglint/parser";

console.log(RuleParser.generate(RuleParser.parse("!+ NOT_OPTIMIZED PLATFORM( windows  , mac)")));
console.log(RuleParser.generate(RuleParser.parse("[$path=/path, sajt=2]example.com,~example.net##.ad > .valami")));
console.log(RuleParser.generate(RuleParser.parse("example.com,~example.net##:matches-path(/path) .ad")));
console.log(RuleParser.generate(RuleParser.parse("[$path=/path]example.com,~example.net#%#//scriptlet('scriptlet',    \"arg0\")")));
console.log(RuleParser.generate(RuleParser.parse("[$path=/path]example.com,~example.net##+js(scriptlet,  , arg1)")));
console.log(RuleParser.generate(RuleParser.parse("example.com#$#scriptlet1 arg0\\ arg0 arg1; scriptlet2;         scriptlet3;")));
console.log(RuleParser.generate(RuleParser.parse("!#if (adguard)")));
console.log(RuleParser.generate(RuleParser.parse("-banner-350px-")));
console.log(RuleParser.generate(RuleParser.parse("/ad.js$script,third-party")));
console.log(RuleParser.generate(RuleParser.parse(`@@||example.org^$replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/v\\$1<\\/VAST>/i`)));
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
