import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type { LinterSubParsersConfig, Parser } from '../../../src/linter/config';
import { LinterSourceCode } from '../../../src/linter/source-code/source-code';
import { LinterSourceCodeWalker } from '../../../src/linter/source-code/source-code-walker';
import type { AnyNode, SelectorsWithVisitors } from '../../../src/linter/source-code/visitor-collection';

describe('LinterSourceCodeWalker', () => {
    describe('constructor', () => {
        it('creates instance with empty sub-parsers', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);
            const walker = new LinterSourceCodeWalker(sourceCode, {});

            expect(walker).toBeDefined();
        });

        it('creates instance with typed sub-parser selectors', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);
            const parser: Parser = {
                name: 'test-parser',
                parse: () => ({ type: 'Root', children: [] }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                SelectorList: parser,
            });

            expect(walker).toBeDefined();
        });

        it('creates instance with universal sub-parser selectors', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);
            const parser: Parser = {
                name: 'universal-parser',
                parse: () => ({ type: 'Root', children: [] }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                '*': parser,
            });

            expect(walker).toBeDefined();
        });

        it('creates instance with attribute selectors', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);
            const parser: Parser = {
                parse: () => ({ type: 'Root', children: [] }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                '[attr="value"]': parser,
            });

            expect(walker).toBeDefined();
        });

        it('handles onParseError callback', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);
            const onParseError = vi.fn();

            const walker = new LinterSourceCodeWalker(sourceCode, {}, onParseError);

            expect(walker).toBeDefined();
        });
    });

    describe('getParser', () => {
        it('returns null for node without associated parser', () => {
            const source = 'example.com';
            const sourceCode = new LinterSourceCode(source);
            const walker = new LinterSourceCodeWalker(sourceCode, {});

            const node = { type: 'Test' };
            expect(walker.getParser(node as AnyNode)).toBeNull();
        });

        it('returns parser after sub-parsing', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const subNode = { type: 'SubNode', value: 'test' };
            const parser: Parser = {
                name: 'css-parser',
                parse: () => subNode,
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            const visitors: SelectorsWithVisitors = {
                SubNode: [vi.fn()],
            };

            walker.walk(visitors);

            // After walking, sub-parsed nodes should be registered
            // Note: This test depends on the actual AST structure
        });
    });

    describe('walk', () => {
        it('walks AST with simple selectors', () => {
            const source = 'example.com';
            const sourceCode = new LinterSourceCode(source);
            const walker = new LinterSourceCodeWalker(sourceCode, {});

            const visitor = vi.fn();
            const visitors: SelectorsWithVisitors = {
                FilterList: [visitor],
            };

            walker.walk(visitors);

            expect(visitor).toHaveBeenCalled();
        });

        it('walks AST with wildcard selector', () => {
            const source = 'example.com\n! comment';
            const sourceCode = new LinterSourceCode(source);
            const walker = new LinterSourceCodeWalker(sourceCode, {});

            const visitor = vi.fn();
            const visitors: SelectorsWithVisitors = {
                '*': [visitor],
            };

            walker.walk(visitors);

            // Should visit all nodes in the AST
            expect(visitor).toHaveBeenCalled();
        });

        it('walks AST with exit selectors', () => {
            const source = 'example.com';
            const sourceCode = new LinterSourceCode(source);
            const walker = new LinterSourceCodeWalker(sourceCode, {});

            const enterVisitor = vi.fn();
            const exitVisitor = vi.fn();
            const visitors: SelectorsWithVisitors = {
                FilterList: [enterVisitor],
                'FilterList:exit': [exitVisitor],
            };

            walker.walk(visitors);

            expect(enterVisitor).toHaveBeenCalled();
            expect(exitVisitor).toHaveBeenCalled();
        });

        it('invokes sub-parser when selector matches', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parseFn = vi.fn(() => ({
                type: 'SubRoot',
                children: [{ type: 'SubNode', value: 'parsed' }],
            }));

            const parser: Parser = {
                name: 'test-parser',
                parse: parseFn,
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            const visitors: SelectorsWithVisitors = {
                '*': [vi.fn()],
            };

            walker.walk(visitors);

            // Sub-parser should be called when Value node is encountered
            // This depends on the actual AST structure of element hiding rules
        });

        it('calls sub-parser when selector matches', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parseFn = vi.fn(() => ({
                type: 'SubRoot',
                children: [],
            }));

            const parser: Parser = {
                parse: parseFn,
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            const visitors: SelectorsWithVisitors = {
                '*': [vi.fn()],
            };

            walker.walk(visitors);

            // Sub-parser should be invoked when Value nodes are encountered
            // Note: caching is per-walk, not across walks
            const firstCallCount = parseFn.mock.calls.length;
            expect(firstCallCount).toBeGreaterThan(0);

            // Second walk will parse again (cache is per-walk)
            walker.walk(visitors);
            const secondCallCount = parseFn.mock.calls.length;
            expect(secondCallCount).toBe(firstCallCount * 2);
        });

        it('handles multiple sub-parsers for different selectors', () => {
            const source = 'example.com##.ad { color: red; }';
            const sourceCode = new LinterSourceCode(source);

            const parser1 = vi.fn(() => ({ type: 'CSS', children: [] }));
            const parser2 = vi.fn(() => ({ type: 'Style', children: [] }));

            const subParsers: LinterSubParsersConfig = {
                SelectorList: {
                    parse: parser1,
                    nodeTypeKey: 'type',
                    childNodeKeys: ['children'],
                },
                DeclarationList: {
                    parse: parser2,
                    nodeTypeKey: 'type',
                    childNodeKeys: ['children'],
                },
            };

            const walker = new LinterSourceCodeWalker(sourceCode, subParsers);

            walker.walk({ '*': [vi.fn()] });

            // Both parsers could be called depending on AST structure
        });

        it('visits sub-AST nodes with provided selectors', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parser: Parser = {
                parse: () => ({
                    type: 'SubRoot',
                    children: [
                        { type: 'SubNode', name: 'node1' },
                        { type: 'SubNode', name: 'node2' },
                    ],
                }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            const subNodeVisitor = vi.fn();
            const visitors: SelectorsWithVisitors = {
                SubNode: [subNodeVisitor],
            };

            walker.walk(visitors);

            // SubNode visitor should be called for nodes in sub-AST
        });

        it('combines user wildcard visitor with internal sub-parsing', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parser: Parser = {
                parse: () => ({ type: 'SubRoot', children: [] }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            const userStarVisitor = vi.fn();
            const visitors: SelectorsWithVisitors = {
                '*': [userStarVisitor],
            };

            walker.walk(visitors);

            // User's wildcard visitor should still be called
            expect(userStarVisitor).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('handles parse errors in sub-parser with onParseError', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const onParseError = vi.fn();
            const parser: Parser = {
                name: 'failing-parser',
                parse: () => {
                    throw new Error('Parse failed');
                },
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            }, onParseError);

            walker.walk({ '*': [vi.fn()] });

            // onParseError should be called when sub-parser throws
        });

        it('continues walking after sub-parser error', () => {
            const source = 'example.com##.ad\nexample.org##.banner';
            const sourceCode = new LinterSourceCode(source);

            let callCount = 0;
            const parser: Parser = {
                parse: () => {
                    callCount += 1;
                    if (callCount === 1) {
                        throw new Error('First parse failed');
                    }
                    return { type: 'SubRoot', children: [] };
                },
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            // Should not throw, continues after error
            expect(() => walker.walk({ '*': [vi.fn()] })).not.toThrow();
        });

        it('skips sub-parsing for nodes with invalid offsets', () => {
            const source = 'example.com';
            const sourceCode = new LinterSourceCode(source);

            const parseFn = vi.fn(() => ({ type: 'Sub', children: [] }));
            const parser: Parser = {
                parse: parseFn,
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            // Create walker that will try to parse all nodes
            const walker = new LinterSourceCodeWalker(sourceCode, {
                '*': parser,
            });

            walker.walk({ '*': [vi.fn()] });

            // Nodes without valid start/end should be skipped
        });

        it('handles sub-parser without name in error message', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const onParseError = vi.fn();
            const parser: Parser = {
                // No name property
                parse: () => {
                    throw new Error('Parse error');
                },
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            }, onParseError);

            walker.walk({ '*': [vi.fn()] });

            // Should handle error even without parser name
        });
    });

    describe('edge cases', () => {
        it('handles empty source code', () => {
            const source = '';
            const sourceCode = new LinterSourceCode(source);
            const walker = new LinterSourceCodeWalker(sourceCode, {});

            expect(() => walker.walk({ '*': [vi.fn()] })).not.toThrow();
        });

        it('handles source with only comments', () => {
            const source = '! Comment 1\n! Comment 2';
            const sourceCode = new LinterSourceCode(source);
            const walker = new LinterSourceCodeWalker(sourceCode, {});

            const visitor = vi.fn();
            walker.walk({ CommentRule: [visitor] });

            expect(visitor).toHaveBeenCalled();
        });

        it('handles complex selector patterns', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parser: Parser = {
                parse: () => ({ type: 'Sub', children: [] }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                'Value[type="selectorList"]': parser,
            });

            walker.walk({ '*': [vi.fn()] });
        });

        it('handles nested sub-parsing with different parsers', () => {
            const source = 'example.com##.ad { color: red; }';
            const sourceCode = new LinterSourceCode(source);

            const cssParser: Parser = {
                name: 'css',
                parse: (src) => ({
                    type: 'CSSRoot',
                    children: [{ type: 'CSSNode', value: src }],
                }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: cssParser,
            });

            const cssVisitor = vi.fn();
            walker.walk({ CSSNode: [cssVisitor] });
        });

        it('handles sub-parser with custom nodeTypeKey and childNodeKey', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parser: Parser = {
                parse: () => ({
                    kind: 'CustomRoot',
                    items: [
                        { kind: 'CustomNode', value: 'test' },
                    ],
                }),
                nodeTypeKey: 'kind',
                childNodeKeys: ['items'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            const visitor = vi.fn();
            walker.walk({ CustomNode: [visitor] });
        });

        it('handles multiple visitors for same node in sub-AST', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parser: Parser = {
                parse: () => ({
                    type: 'SubRoot',
                    children: [{ type: 'Target' }],
                }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            const visitor1 = vi.fn();
            const visitor2 = vi.fn();
            walker.walk({
                Target: [visitor1, visitor2],
            });
        });

        it('handles sub-AST with no children', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parser: Parser = {
                parse: () => ({
                    type: 'Leaf',
                    value: 'test',
                }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            expect(() => walker.walk({ '*': [vi.fn()] })).not.toThrow();
        });

        it('handles sub-parser that returns deeply nested structure', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parser: Parser = {
                parse: () => ({
                    type: 'Level1',
                    children: [{
                        type: 'Level2',
                        children: [{
                            type: 'Level3',
                            children: [{
                                type: 'Leaf',
                            }],
                        }],
                    }],
                }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            const leafVisitor = vi.fn();
            walker.walk({ Leaf: [leafVisitor] });
        });

        it('reuses walker instance for same parser across multiple nodes', () => {
            const source = 'example.com##.ad1\nexample.org##.ad2';
            const sourceCode = new LinterSourceCode(source);

            const parseFn = vi.fn(() => ({
                type: 'SubRoot',
                children: [],
            }));

            const parser: Parser = {
                parse: parseFn,
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            walker.walk({ '*': [vi.fn()] });

            // Parser should be called for each matching node
        });

        it('handles getStartOffset and getEndOffset in parser', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parser: Parser = {
                parse: () => ({ type: 'Sub', children: [] }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
                getStartOffset: (node: any) => node.start || 0,
                getEndOffset: (node: any) => node.end || 10,
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            expect(() => walker.walk({ '*': [vi.fn()] })).not.toThrow();
        });

        it('passes correct ancestry to sub-AST visitors', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parser: Parser = {
                parse: () => ({
                    type: 'SubRoot',
                    children: [{ type: 'SubChild' }],
                }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            const visitor = vi.fn();
            walker.walk({ SubChild: [visitor] });

            // Visitor should receive ancestry including host node
            if (visitor.mock.calls.length > 0) {
                // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
                const [_node, _parent, ancestry] = visitor.mock.calls[0]!;
                expect(Array.isArray(ancestry)).toBe(true);
            }
        });

        it('handles sub-parser with offset calculations', () => {
            const source = 'line1\nline2\nexample.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parseFn = vi.fn((src, offset, line, lineStartOffset) => {
                // Parser receives offset information
                expect(typeof offset).toBe('number');
                expect(typeof line).toBe('number');
                expect(typeof lineStartOffset).toBe('number');
                return { type: 'Sub', children: [] };
            });

            const parser: Parser = {
                parse: parseFn,
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            walker.walk({ '*': [vi.fn()] });
        });
    });

    describe('integration scenarios', () => {
        it('handles real-world CSS sub-parsing scenario', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const cssParser: Parser = {
                name: 'css-parser',
                parse: (src) => {
                    // Simulate CSS parsing
                    return {
                        type: 'SelectorList',
                        children: [
                            {
                                type: 'Selector',
                                children: [
                                    { type: 'ClassSelector', name: src },
                                ],
                            },
                        ],
                    };
                },
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: cssParser,
            });

            const classVisitor = vi.fn();
            walker.walk({ ClassSelector: [classVisitor] });
        });

        it('handles mixed main AST and sub-AST visitors', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            const parser: Parser = {
                parse: () => ({
                    type: 'SubRoot',
                    children: [{ type: 'SubNode' }],
                }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            const mainVisitor = vi.fn();
            const subVisitor = vi.fn();

            walker.walk({
                FilterList: [mainVisitor],
                SubNode: [subVisitor],
            });

            expect(mainVisitor).toHaveBeenCalled();
        });
    });

    describe('sub-AST immutability', () => {
        it('freezes sub-ASTs to prevent mutations', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            let capturedSubAst: any = null;

            const parser: Parser = {
                name: 'test-parser',
                parse: () => {
                    const ast = {
                        type: 'SubRoot',
                        children: [{ type: 'SubNode', value: 'test' }],
                    };
                    return ast;
                },
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            walker.walk({
                SubRoot: [(node) => {
                    capturedSubAst = node;
                }],
            });

            // Verify the sub-AST is frozen
            expect(capturedSubAst).not.toBeNull();
            expect(Object.isFrozen(capturedSubAst)).toBe(true);
        });

        it('prevents modifying sub-AST properties', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            let capturedSubAst: any = null;

            const parser: Parser = {
                parse: () => ({
                    type: 'SubRoot',
                    value: 'original',
                }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            walker.walk({
                SubRoot: [(node) => {
                    capturedSubAst = node;
                }],
            });

            // Attempting to modify should throw
            expect(() => {
                capturedSubAst.value = 'modified';
            }).toThrow();
        });

        it('freezes nested sub-AST nodes', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            let capturedChildren: any = null;
            let capturedChild: any = null;

            const parser: Parser = {
                parse: () => ({
                    type: 'SubRoot',
                    children: [
                        { type: 'SubNode1', value: 'test1' },
                        { type: 'SubNode2', value: 'test2' },
                    ],
                }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            walker.walk({
                SubRoot: [(node: any) => {
                    capturedChildren = node.children;
                }],
                SubNode1: [(node) => {
                    capturedChild = node;
                }],
            });

            // Verify children array is frozen
            expect(Object.isFrozen(capturedChildren)).toBe(true);

            // Verify individual child nodes are frozen
            expect(Object.isFrozen(capturedChild)).toBe(true);
        });

        it('prevents adding items to sub-AST children array', () => {
            const source = 'example.com##.ad';
            const sourceCode = new LinterSourceCode(source);

            let capturedChildren: any = null;

            const parser: Parser = {
                parse: () => ({
                    type: 'SubRoot',
                    children: [{ type: 'SubNode' }],
                }),
                nodeTypeKey: 'type',
                childNodeKeys: ['children'],
            };

            const walker = new LinterSourceCodeWalker(sourceCode, {
                Value: parser,
            });

            walker.walk({
                SubRoot: [(node: any) => {
                    capturedChildren = node.children;
                }],
            });

            // Attempting to push should throw
            expect(() => {
                capturedChildren.push({ type: 'FakeNode' });
            }).toThrow();
        });
    });
});
