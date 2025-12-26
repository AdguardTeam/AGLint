/**
 * @file Constant values used by all parts of the library.
 */

// General
export const EMPTY = '';
export const SPACE = ' ';
export const TAB = '\t';

export const COLON = ':';
export const COMMA = ',';
export const DOT = '.';
export const SEMICOLON = ';';

export const AMPERSAND = '&';
export const ASTERISK = '*';
export const AT_SIGN = '@';
export const BACKTICK = '`';
export const CARET = '^';
export const DOLLAR_SIGN = '$';
export const EQUALS = '=';
export const EXCLAMATION_MARK = '!';
export const GREATER_THAN = '>';
export const HASHMARK = '#';
export const LESS_THAN = '<';
export const MINUS = '-';
export const PERCENT = '%';
export const PIPE = '|';
export const PLUS = '+';
export const QUESTION_MARK = '?';
export const SLASH = '/';
export const TILDE = '~';
export const UNDERSCORE = '_';

// Escape characters
export const BACKSLASH = '\\';
export const ESCAPE_CHARACTER = BACKSLASH;

// Newlines
export const CR = '\r';
export const FF = '\f';
export const LF = '\n';
export const CRLF = CR + LF;
export const DOUBLE_NEWLINE = '\n\n';
export const NEWLINE = LF;

// Quotes
export const BACKTICK_QUOTE = '`';
export const DOUBLE_QUOTE = '"';
export const SINGLE_QUOTE = '\'';

// Brackets
export const OPEN_PARENTHESIS = '(';
export const CLOSE_PARENTHESIS = ')';

export const OPEN_SQUARE_BRACKET = '[';
export const CLOSE_SQUARE_BRACKET = ']';

export const OPEN_CURLY_BRACKET = '{';
export const CLOSE_CURLY_BRACKET = '}';

// Operators
export const ASSIGN_OPERATOR = EQUALS;

// Letters
export const SMALL_LETTER_A = 'a';
export const SMALL_LETTER_B = 'b';
export const SMALL_LETTER_C = 'c';
export const SMALL_LETTER_D = 'd';
export const SMALL_LETTER_E = 'e';
export const SMALL_LETTER_F = 'f';
export const SMALL_LETTER_G = 'g';
export const SMALL_LETTER_H = 'h';
export const SMALL_LETTER_I = 'i';
export const SMALL_LETTER_J = 'j';
export const SMALL_LETTER_K = 'k';
export const SMALL_LETTER_L = 'l';
export const SMALL_LETTER_M = 'm';
export const SMALL_LETTER_N = 'n';
export const SMALL_LETTER_O = 'o';
export const SMALL_LETTER_P = 'p';
export const SMALL_LETTER_Q = 'q';
export const SMALL_LETTER_R = 'r';
export const SMALL_LETTER_S = 's';
export const SMALL_LETTER_T = 't';
export const SMALL_LETTER_U = 'u';
export const SMALL_LETTER_V = 'v';
export const SMALL_LETTER_W = 'w';
export const SMALL_LETTER_X = 'x';
export const SMALL_LETTER_Y = 'y';
export const SMALL_LETTER_Z = 'z';

// Capital letters
export const CAPITAL_LETTER_A = 'A';
export const CAPITAL_LETTER_B = 'B';
export const CAPITAL_LETTER_C = 'C';
export const CAPITAL_LETTER_D = 'D';
export const CAPITAL_LETTER_E = 'E';
export const CAPITAL_LETTER_F = 'F';
export const CAPITAL_LETTER_G = 'G';
export const CAPITAL_LETTER_H = 'H';
export const CAPITAL_LETTER_I = 'I';
export const CAPITAL_LETTER_J = 'J';
export const CAPITAL_LETTER_K = 'K';
export const CAPITAL_LETTER_L = 'L';
export const CAPITAL_LETTER_M = 'M';
export const CAPITAL_LETTER_N = 'N';
export const CAPITAL_LETTER_O = 'O';
export const CAPITAL_LETTER_P = 'P';
export const CAPITAL_LETTER_Q = 'Q';
export const CAPITAL_LETTER_R = 'R';
export const CAPITAL_LETTER_S = 'S';
export const CAPITAL_LETTER_T = 'T';
export const CAPITAL_LETTER_U = 'U';
export const CAPITAL_LETTER_V = 'V';
export const CAPITAL_LETTER_W = 'W';
export const CAPITAL_LETTER_X = 'X';
export const CAPITAL_LETTER_Y = 'Y';
export const CAPITAL_LETTER_Z = 'Z';

// Numbers as strings
export const NUMBER_0 = '0';
export const NUMBER_1 = '1';
export const NUMBER_2 = '2';
export const NUMBER_3 = '3';
export const NUMBER_4 = '4';
export const NUMBER_5 = '5';
export const NUMBER_6 = '6';
export const NUMBER_7 = '7';
export const NUMBER_8 = '8';
export const NUMBER_9 = '9';

export const ADG_SCRIPTLET_MASK = '//scriptlet';
export const UBO_SCRIPTLET_MASK = 'js';

// Modifiers are separated by ",". For example: "script,domain=example.com"
export const MODIFIERS_SEPARATOR = ',';
export const MODIFIER_EXCEPTION_MARKER = '~';
export const MODIFIER_ASSIGN_OPERATOR = '=';

export const DOMAIN_EXCEPTION_MARKER = '~';

/**
 * Classic domain separator.
 *
 * @example
 * ```adblock
 * ! Domains are separated by ",":
 * example.com,~example.org##.ads
 * ```
 */
export const CLASSIC_DOMAIN_SEPARATOR = ',';

/**
 * Modifier domain separator.
 *
 * @example
 * ```adblock
 * ! Domains are separated by "|":
 * ads.js^$script,domains=example.com|~example.org
 * ```
 */
export const MODIFIER_DOMAIN_SEPARATOR = '|';

export const DOMAIN_LIST_TYPE = 'DomainList';

// CSS
export const CSS_CLASS_MARKER = '.';
export const CSS_ID_MARKER = '#';

export const CSS_SELECTORS_SEPARATOR = ',';

export const CSS_MEDIA_MARKER = '@media';

export const CSS_PSEUDO_MARKER = ':';
export const CSS_PSEUDO_OPEN = '(';
export const CSS_PSEUDO_CLOSE = ')';

export const CSS_NOT_PSEUDO = 'not';

export const CSS_BLOCK_OPEN = '{';
export const CSS_BLOCK_CLOSE = '}';

export const CSS_ATTRIBUTE_SELECTOR_OPEN = '[';
export const CSS_ATTRIBUTE_SELECTOR_CLOSE = ']';

export const CSS_IMPORTANT = '!important';
export const CSS_DECLARATION_END = ';';
export const CSS_DECLARATION_SEPARATOR = ':';

export const HINT_MARKER = '!+';
export const HINT_MARKER_LEN = HINT_MARKER.length;

export const NETWORK_RULE_EXCEPTION_MARKER = '@@';
export const NETWORK_RULE_EXCEPTION_MARKER_LEN = NETWORK_RULE_EXCEPTION_MARKER.length;
export const NETWORK_RULE_SEPARATOR = '$';

export const AGLINT_COMMAND_PREFIX = 'aglint';
export const AGLINT_CONFIG_COMMENT_MARKER = '--';

export const PREPROCESSOR_MARKER = '!#';
export const PREPROCESSOR_MARKER_LEN = PREPROCESSOR_MARKER.length;
export const PREPROCESSOR_SEPARATOR = ' ';

export const IF_DIRECTIVE = 'if';
export const ELSE_DIRECTIVE = 'else';
export const ENDIF_DIRECTIVE = 'endif';
export const INCLUDE_DIRECTIVE = 'include';
export const SAFARI_CB_AFFINITY_DIRECTIVE = 'safari_cb_affinity';

export const SUPPORTED_PREPROCESSOR_DIRECTIVES = new Set([
    ELSE_DIRECTIVE,
    ENDIF_DIRECTIVE,
    IF_DIRECTIVE,
    INCLUDE_DIRECTIVE,
    SAFARI_CB_AFFINITY_DIRECTIVE,
]);

export const REMOVE_PROPERTY = 'remove';
export const REMOVE_VALUE = 'true';

/**
 * Supported Extended CSS pseudo-classes.
 *
 * These pseudo-classes are not supported by browsers natively, so we need Extended CSS library to support them.
 *
 * Please keep this list sorted alphabetically.
 */
export const SUPPORTED_EXT_CSS_PSEUDO_CLASSES = new Set([
    /**
     * Pseudo-classes :is(), and :not() may use native implementation.
     *
     * @see {@link https://github.com/AdguardTeam/ExtendedCss#extended-css-is}
     * @see {@link https://github.com/AdguardTeam/ExtendedCss#extended-css-not}
     */
    /**
     * :has() should also be conditionally considered as extended and should not be in this list,
     * for details check: https://github.com/AdguardTeam/ExtendedCss#extended-css-has,
     * but there is a bug with content blocker in safari:
     * for details check: https://bugs.webkit.org/show_bug.cgi?id=248868.
     *
     * TODO: remove 'has' later.
     */
    '-abp-contains', // alias for 'contains'
    '-abp-has', // alias for 'has'
    'contains',
    'has', // some browsers support 'has' natively
    'has-text', // alias for 'contains'
    'if',
    'if-not',
    'matches-attr',
    'matches-css',
    'matches-css-after', // deprecated, replaced by 'matches-css'
    'matches-css-before', // deprecated, replaced by 'matches-css'
    'matches-property',
    'nth-ancestor',
    'remove',
    'upward',
    'xpath',
    'style',
    'matches-media',
]);

// TODO: Use compatibility tables once they support Extended CSS pseudo-classes.
// https://github.com/AdguardTeam/tsurlfilter/issues/175

/**
 * Supported Extended CSS pseudo-classes.
 *
 * These pseudo-classes are not supported by browsers natively, so we need Extended CSS library to support them.
 *
 * Please keep this list sorted alphabetically.
 */
export const SUPPORTED_ADG_PSEUDO_CLASSES: ReadonlySet<string> = new Set([
    /**
     * Pseudo-classes :is(), and :not() may use native implementation.
     *
     * @see {@link https://github.com/AdguardTeam/ExtendedCss#extended-css-is}
     * @see {@link https://github.com/AdguardTeam/ExtendedCss#extended-css-not}
     */
    /**
     * :has() should also be conditionally considered as extended and should not be in this list,
     * for details check: https://github.com/AdguardTeam/ExtendedCss#extended-css-has,
     * but there is a bug with content blocker in safari:
     * for details check: https://bugs.webkit.org/show_bug.cgi?id=248868.
     *
     * TODO: remove 'has' later.
     */
    '-abp-contains', // alias for 'contains'
    '-abp-has', // alias for 'has'
    'contains',
    'has', // some browsers support 'has' natively
    'has-text', // alias for 'contains'
    'if',
    'if-not',
    'matches-attr',
    'matches-css',
    'matches-css-after', // deprecated, replaced by 'matches-css'
    'matches-css-before', // deprecated, replaced by 'matches-css'
    'matches-property',
    'nth-ancestor',
    'remove',
    'upward',
    'xpath',
]);

/**
 * Supported ABP Extended CSS pseudo-classes.
 *
 * These pseudo-classes are not supported by browsers natively, so we need Extended CSS library to support them.
 *
 * Please keep this list sorted alphabetically.
 *
 * @see {@link https://help.adblockplus.org/hc/en-us/articles/360062733293-How-to-write-filters#elemhide-emulation}
 */
export const SUPPORTED_ABP_PSEUDO_CLASSES: ReadonlySet<string> = new Set([
    '-abp-contains',
    '-abp-has',
    '-abp-properties',
    'xpath',
]);

/**
 * Supported uBlock action operators.
 *
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#action-operators}
 */
export const SUPPORTED_UBO_ACTION_OPERATORS = new Set([
    'remove',
    'remove-attr',
    'remove-class',
    'style',
]);

/**
 * Supported uBlock procedural pseudo-classes.
 *
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#procedural-cosmetic-filters}
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#action-operators}
 */
export const SUPPORTED_UBO_PSEUDO_CLASSES: ReadonlySet<string> = new Set([
    'has',
    'has-text',
    'matches-attr',
    'matches-css',
    'matches-css-after',
    'matches-css-before',
    'matches-media',
    'matches-path',
    'matches-prop',
    'min-text-length',
    'not',
    'others',
    'upward',
    'watch-attr',
    'xpath',
    ...SUPPORTED_UBO_ACTION_OPERATORS,
]);

/**
 * Supported native CSS pseudo-classes.
 *
 * These pseudo-classes are supported by browsers natively, so we don't need Extended CSS library to support them.
 *
 * The problem with pseudo-classes is that any unknown pseudo-class makes browser ignore the whole CSS rule,
 * which contains a lot more selectors. So, if CSS selector contains a pseudo-class, we should try to validate it.
 * One more problem with pseudo-classes is that they are actively used in uBlock, hence it may mess AG styles.
 *
 * Please keep this list sorted alphabetically.
 */
export const SUPPORTED_CSS_PSEUDO_CLASSES = new Set([
    'active', // https://developer.mozilla.org/en-US/docs/Web/CSS/:active
    'checked', // https://developer.mozilla.org/en-US/docs/Web/CSS/:checked
    'disabled', // https://developer.mozilla.org/en-US/docs/Web/CSS/:disabled
    'empty', // https://developer.mozilla.org/en-US/docs/Web/CSS/:empty
    'enabled', // https://developer.mozilla.org/en-US/docs/Web/CSS/:enabled
    'first-child', // https://developer.mozilla.org/en-US/docs/Web/CSS/:first-child
    'first-of-type', // https://developer.mozilla.org/en-US/docs/Web/CSS/:first-of-type
    'focus', // https://developer.mozilla.org/en-US/docs/Web/CSS/:focus
    'has', // https://developer.mozilla.org/en-US/docs/Web/CSS/:has
    'hover', // https://developer.mozilla.org/en-US/docs/Web/CSS/:hover
    'in-range', // https://developer.mozilla.org/en-US/docs/Web/CSS/:in-range
    'invalid', // https://developer.mozilla.org/en-US/docs/Web/CSS/:invalid
    'is', // https://developer.mozilla.org/en-US/docs/Web/CSS/:is
    'lang', // https://developer.mozilla.org/en-US/docs/Web/CSS/:lang
    'last-child', // https://developer.mozilla.org/en-US/docs/Web/CSS/:last-child
    'last-of-type', // https://developer.mozilla.org/en-US/docs/Web/CSS/:last-of-type
    'link', // https://developer.mozilla.org/en-US/docs/Web/CSS/:link
    'not', // https://developer.mozilla.org/en-US/docs/Web/CSS/:not
    'nth-child', // https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-child
    'nth-last-child', // https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-last-child
    'nth-last-of-type', // https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-last-of-type
    'nth-of-type', // https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-of-type
    'only-child', // https://developer.mozilla.org/en-US/docs/Web/CSS/:only-child
    'only-of-type', // https://developer.mozilla.org/en-US/docs/Web/CSS/:only-of-type
    'optional', // https://developer.mozilla.org/en-US/docs/Web/CSS/:optional
    'out-of-range', // https://developer.mozilla.org/en-US/docs/Web/CSS/:out-of-range
    'read-only', // https://developer.mozilla.org/en-US/docs/Web/CSS/:read-only
    'read-write', // https://developer.mozilla.org/en-US/docs/Web/CSS/:read-write
    'required', // https://developer.mozilla.org/en-US/docs/Web/CSS/:required
    'root', // https://developer.mozilla.org/en-US/docs/Web/CSS/:root
    'target', // https://developer.mozilla.org/en-US/docs/Web/CSS/:target
    'valid', // https://developer.mozilla.org/en-US/docs/Web/CSS/:valid
    'visited', // https://developer.mozilla.org/en-US/docs/Web/CSS/:visited
    'where', // https://developer.mozilla.org/en-US/docs/Web/CSS/:where
]);
