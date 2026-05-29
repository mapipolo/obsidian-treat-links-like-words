import { describe, test, expect } from "vitest";
import {
	findLinksInLine,
	linkBefore,
	linkAfter,
	linkContaining,
} from "../src/linkUtils";

describe("findLinksInLine", () => {
	test("finds a simple wikilink", () => {
		const line = "this is a [[link]] to a page";
		expect(findLinksInLine(line)).toEqual([{ start: 10, end: 18 }]);
	});

	test("finds a wikilink with alias", () => {
		const line = "see [[some/page|the alias]] please";
		const links = findLinksInLine(line);
		expect(links).toHaveLength(1);
		expect(line.slice(links[0].start, links[0].end)).toBe(
			"[[some/page|the alias]]"
		);
	});

	test("finds a wikilink with folder path and heading", () => {
		const line = "x [[folder/sub/page#heading|alias]] y";
		const links = findLinksInLine(line);
		expect(links).toHaveLength(1);
		expect(line.slice(links[0].start, links[0].end)).toBe(
			"[[folder/sub/page#heading|alias]]"
		);
	});

	test("finds a Markdown link", () => {
		const line = "go to [a link](https://example.com) now";
		const links = findLinksInLine(line);
		expect(links).toHaveLength(1);
		expect(line.slice(links[0].start, links[0].end)).toBe(
			"[a link](https://example.com)"
		);
	});

	test("finds multiple links on a line", () => {
		const line = "[[a]] middle [b](u) end";
		const links = findLinksInLine(line);
		expect(links.map((r) => line.slice(r.start, r.end))).toEqual([
			"[[a]]",
			"[b](u)",
		]);
	});
});

describe("linkContaining", () => {
	test("inside a wikilink returns the link range", () => {
		const line = "this is a [[link]] to a page";
		// Cursor between "li" and "nk" inside the wikilink at column 14.
		expect(linkContaining(line, 14)).toEqual({ start: 10, end: 18 });
	});

	test("at the boundary of a link returns null", () => {
		const line = "this is a [[link]] to a page";
		expect(linkContaining(line, 10)).toBeNull(); // just before "[["
		expect(linkContaining(line, 18)).toBeNull(); // just after "]]"
	});

	test("outside any link returns null", () => {
		const line = "this is a [[link]] to a page";
		expect(linkContaining(line, 5)).toBeNull();
	});
});

describe("linkBefore", () => {
	test("cursor immediately after a wikilink", () => {
		const line = "this is a [[link]] to a page";
		// Cursor at column 18 — right after "]]".
		const hit = linkBefore(line, 18);
		expect(hit).not.toBeNull();
		expect(hit!.range).toEqual({ start: 10, end: 18 });
		expect(hit!.spacesBetween).toBe(0);
	});

	test("cursor after one or more spaces following a link", () => {
		const line = "[[link]]   to a page";
		// Cursor at column 11 (after three spaces).
		const hit = linkBefore(line, 11);
		expect(hit).not.toBeNull();
		expect(hit!.range).toEqual({ start: 0, end: 8 });
		expect(hit!.spacesBetween).toBe(3);
	});

	test("does not cross a tab", () => {
		const line = "[[link]]\tafter";
		const hit = linkBefore(line, 9); // after the tab
		expect(hit).toBeNull();
	});

	test("Markdown link before cursor", () => {
		const line = "see [text](url) here";
		const hit = linkBefore(line, 15); // right after ")"
		expect(hit).not.toBeNull();
		expect(line.slice(hit!.range.start, hit!.range.end)).toBe("[text](url)");
	});

	test("alias wikilink before cursor", () => {
		const line = "[[page|alias]] x";
		const hit = linkBefore(line, 14);
		expect(hit).not.toBeNull();
		expect(line.slice(hit!.range.start, hit!.range.end)).toBe(
			"[[page|alias]]"
		);
	});

	test("non-link word before cursor returns null", () => {
		const line = "hello world";
		expect(linkBefore(line, 11)).toBeNull();
	});
});

describe("linkAfter", () => {
	test("cursor immediately before a wikilink", () => {
		const line = "this is a [[link]] to a page";
		const hit = linkAfter(line, 10);
		expect(hit).not.toBeNull();
		expect(hit!.range).toEqual({ start: 10, end: 18 });
		expect(hit!.spacesBetween).toBe(0);
	});

	test("cursor before some spaces and then a link", () => {
		const line = "x   [[link]] y";
		const hit = linkAfter(line, 1);
		expect(hit).not.toBeNull();
		expect(hit!.spacesBetween).toBe(3);
		expect(hit!.range).toEqual({ start: 4, end: 12 });
	});

	test("Markdown link after cursor", () => {
		const line = "  [a](b) trailing";
		const hit = linkAfter(line, 0);
		expect(hit).not.toBeNull();
		expect(line.slice(hit!.range.start, hit!.range.end)).toBe("[a](b)");
	});

	test("non-link word after cursor returns null", () => {
		const line = "hello world";
		expect(linkAfter(line, 0)).toBeNull();
	});
});
