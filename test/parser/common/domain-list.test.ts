import {
    DomainListParser,
    DomainListSeparator,
    DOMAIN_LIST_TYPE,
    DomainList,
} from "../../../src/parser/common/domain-list";
import { COMMA, EMPTY } from "../../../src/utils/constants";

describe("DomainListParser", () => {
    test("parse", () => {
        // Single domain
        expect(DomainListParser.parse("example.com")).toEqual(<DomainList>{
            type: DOMAIN_LIST_TYPE,
            separator: COMMA,
            domains: [{ domain: "example.com", exception: false }],
        });

        // Multiple domains
        expect(DomainListParser.parse("example.com,example.net")).toEqual(<DomainList>{
            type: DOMAIN_LIST_TYPE,
            separator: COMMA,
            domains: [
                { domain: "example.com", exception: false },
                { domain: "example.net", exception: false },
            ],
        });

        expect(DomainListParser.parse("example.com,example.net,example.org")).toEqual(<DomainList>{
            type: DOMAIN_LIST_TYPE,
            separator: COMMA,
            domains: [
                { domain: "example.com", exception: false },
                { domain: "example.net", exception: false },
                { domain: "example.org", exception: false },
            ],
        });

        // Exception - single domain
        expect(DomainListParser.parse("~example.com")).toEqual(<DomainList>{
            type: DOMAIN_LIST_TYPE,
            separator: COMMA,
            domains: [{ domain: "example.com", exception: true }],
        });

        // Exception - multiple domains
        expect(DomainListParser.parse("~example.com,~example.net")).toEqual(<DomainList>{
            type: DOMAIN_LIST_TYPE,
            separator: COMMA,
            domains: [
                { domain: "example.com", exception: true },
                { domain: "example.net", exception: true },
            ],
        });

        expect(DomainListParser.parse("~example.com,~example.net,~example.org")).toEqual(<DomainList>{
            type: DOMAIN_LIST_TYPE,
            separator: COMMA,
            domains: [
                { domain: "example.com", exception: true },
                { domain: "example.net", exception: true },
                { domain: "example.org", exception: true },
            ],
        });

        // Mixed - multiple domains
        expect(DomainListParser.parse("~example.com,~example.net,example.eu,~example.org")).toEqual(<DomainList>{
            type: DOMAIN_LIST_TYPE,
            separator: COMMA,
            domains: [
                { domain: "example.com", exception: true },
                { domain: "example.net", exception: true },
                { domain: "example.eu", exception: false },
                { domain: "example.org", exception: true },
            ],
        });

        // Mixed - spaces (trim)
        expect(DomainListParser.parse("~example.com,  example.net    ,   example.eu ,        ~example.org")).toEqual(<
            DomainList
        >{
            type: DOMAIN_LIST_TYPE,
            separator: COMMA,
            domains: [
                { domain: "example.com", exception: true },
                { domain: "example.net", exception: false },
                { domain: "example.eu", exception: false },
                { domain: "example.org", exception: true },
            ],
        });

        expect(
            DomainListParser.parse("~example.com|  example.net    |   example.eu |        ~example.org", "|")
        ).toEqual(<DomainList>{
            type: DOMAIN_LIST_TYPE,
            separator: "|",
            domains: [
                { domain: "example.com", exception: true },
                { domain: "example.net", exception: false },
                { domain: "example.eu", exception: false },
                { domain: "example.org", exception: true },
            ],
        });

        // Invalid cases
        expect(() => DomainListParser.parse(EMPTY)).toThrowError(/^Empty domain specified in domain list/);

        expect(() => DomainListParser.parse("~")).toThrowError(/^Empty domain specified in domain list/);

        expect(() => DomainListParser.parse("~~~")).toThrowError(
            "Exception marker is followed by another exception marker"
        );

        expect(() => DomainListParser.parse(" ~ ~ ~ ")).toThrowError(
            "Exception marker is followed by a whitespace character"
        );

        expect(() => DomainListParser.parse("~,~,~")).toThrowError(/^Empty domain specified in domain list/);

        expect(() => DomainListParser.parse("~  example.com")).toThrowError(
            "Exception marker is followed by a whitespace character"
        );
    });

    test("generate", () => {
        const parseAndGenerate = (raw: string, separator: DomainListSeparator = COMMA) => {
            const ast = DomainListParser.parse(raw, separator);

            if (ast) {
                return DomainListParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate("example.com")).toEqual("example.com");
        expect(parseAndGenerate("~example.com")).toEqual("~example.com");
        expect(parseAndGenerate("example.com,example.org")).toEqual("example.com,example.org");
        expect(parseAndGenerate("example.com,~example.org")).toEqual("example.com,~example.org");
        expect(parseAndGenerate("~example.com,~example.org")).toEqual("~example.com,~example.org");
        expect(parseAndGenerate("~example.com,example.org,example.net")).toEqual(
            "~example.com,example.org,example.net"
        );
        expect(parseAndGenerate("~example.com|example.org|example.net", "|")).toEqual(
            "~example.com|example.org|example.net"
        );
    });
});
