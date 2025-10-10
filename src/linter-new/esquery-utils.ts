import type esquery from 'esquery';

/**
 * Utilities for working with EsQuery ASTs.
 */
export class EsQueryUtils {
    /**
     * Extract a narrowed set of candidate ESTree node types for the subject of a selector.
     * Returns null if the selector does not narrow the subject (e.g. "*", :class, regex/unknown type).
     *
     * @param selAst - EsQuery selector AST.
     *
     * @returns Set of narrowed candidate ESTree node types.
     */
    public static getCandidateTypes(selAst: esquery.Selector): Set<string> | null {
        const out = new Set<string>();
        // set true if we see wildcard/class/unknown in the subject
        let unconstrained = false;

        const hasExplicitSubject = (n: any): boolean => {
            let found = false;

            const walk = (x: any) => {
                if (found || !x || typeof x !== 'object') {
                    return;
                }

                if ((x as any).subject === true) {
                    found = true;
                    return;
                }

                for (const v of Object.values(x)) {
                    if (!v) {
                        continue;
                    }

                    if (Array.isArray(v)) {
                        v.forEach(walk);
                    } else {
                        walk(v);
                    }
                }
            };

            walk(n);

            return found;
        };

        const addTypeLiteral = (val: any) => {
            if (!val || typeof val !== 'object') {
                unconstrained = true;
                return;
            }

            switch (val.type) {
                case 'literal': {
                    // only string literals can narrow to a concrete ESTree node type
                    if (typeof val.value === 'string') {
                        out.add(val.value);
                    } else {
                        unconstrained = true;
                    }
                    break;
                }

                case 'type': {
                    // esquery "Type" atom
                    if (typeof val.value === 'string') {
                        out.add(val.value);
                    } else {
                        unconstrained = true;
                    }
                    break;
                }

                case 'regexp':
                    // regex can't narrow to a single concrete type
                    unconstrained = true;
                    break;

                default:
                    unconstrained = true;
            }
        };

        const collect = (node: any, isSubjectCtx: boolean) => {
            if (!node || typeof node !== 'object') {
                return;
            }

            switch (node.type) {
                // concrete subject atoms
                case 'identifier': // e.g. Identifier
                case 'type': // e.g. Type{value:"Identifier"} inside attributes etc.
                    if (isSubjectCtx && typeof node.value === 'string') {
                        out.add(node.value);
                    }

                    return;

                case 'attribute':
                    if (!isSubjectCtx) {
                        return;
                    }

                    if (node.name === 'type') {
                        // [type="Identifier"] or [type=/^Ident/] or [type=Type(…)]
                        if (node.value == null) {
                            // exists-but-unspecified: doesn't narrow the type
                            unconstrained = true;
                        } else {
                            addTypeLiteral(node.value);
                        }
                    }
                    // other attributes (name/generator/etc.) don't change the type set
                    return;

                case 'wildcard': // "*"
                case 'class': // :statement, :expression, etc. → too broad
                    if (isSubjectCtx) {
                        unconstrained = true;
                    }

                    return;

                case 'compound': // compound selector (A[B][C]…)
                    for (const s of node.selectors ?? []) {
                        collect(s, isSubjectCtx);
                    }

                    return;

                case 'matches': // :matches(...) → union
                    for (const s of node.selectors ?? []) {
                        collect(s, isSubjectCtx);
                    }

                    return;

                case 'not': // :not(...) → filters subject; inside is NOT subject
                case 'has': // :has(...) → filters subject; inside is NOT subject
                    for (const s of node.selectors ?? []) {
                        collect(s, false);
                    }

                    return;

                // binary combinators: default subject is the RIGHT side unless there is explicit "!"
                case 'child':
                case 'descendant':
                case 'sibling':
                case 'adjacent': {
                    const L = node.left;
                    const R = node.right;
                    const leftHas = hasExplicitSubject(L);
                    const rightHas = hasExplicitSubject(R);

                    if (leftHas || rightHas) {
                        collect(L, !!leftHas);
                        collect(R, !!rightHas);

                        // also walk non-subject sides to catch nested explicit subjects deeper down
                        if (!leftHas) {
                            collect(L, false);
                        }
                        if (!rightHas) {
                            collect(R, false);
                        }
                    } else {
                        // default: right branch is the subject of the overall selector
                        collect(L, false);
                        collect(R, isSubjectCtx);
                    }

                    break;
                }

                default:
                    // do not generically recurse: we only traverse nodes we understand,
                    // otherwise we risk pulling non-subject types.
            }
        };

        collect(selAst as any, true);

        if (unconstrained || out.size === 0) {
            return null;
        }

        return out;
    }
}
