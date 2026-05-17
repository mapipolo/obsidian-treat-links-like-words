import {
	planDeleteBackward,
	planDeleteForward,
	planMoveLeft,
	planMoveRight,
	applyLineEdit,
} from "../src/linkUtils";

/**
 * Helper: take a line containing a single "^" caret marker, run the
 * backward-delete planner, and return the resulting line + caret position
 * as a "^"-marked string. Makes the SPEC examples literal in code.
 */
function withCaret(s: string): { line: string; col: number } {
	const col = s.indexOf("^");
	if (col < 0) throw new Error(`no caret in: ${s}`);
	return { line: s.slice(0, col) + s.slice(col + 1), col };
}

function renderCaret(line: string, col: number): string {
	return line.slice(0, col) + "^" + line.slice(col);
}

describe("SPEC examples — Backspace deletes a link to the left", () => {
	test("wikilink immediately before the caret", () => {
		const { line, col } = withCaret("this is a [[link]]^ to a page");
		const plan = planDeleteBackward(line, col);
		expect(plan).not.toBeNull();
		const { line: out, col: newCol } = applyLineEdit(line, plan!);
		expect(renderCaret(out, newCol)).toBe("this is a ^ to a page");
	});

	test("wikilink with alias", () => {
		const { line, col } = withCaret("this is a [[page|alias]]^ to a page");
		const plan = planDeleteBackward(line, col)!;
		const { line: out, col: newCol } = applyLineEdit(line, plan);
		expect(renderCaret(out, newCol)).toBe("this is a ^ to a page");
	});

	test("wikilink with folder path and alias", () => {
		const { line, col } = withCaret(
			"see [[folder/sub/page|the alias]]^ now"
		);
		const plan = planDeleteBackward(line, col)!;
		const { line: out, col: newCol } = applyLineEdit(line, plan);
		expect(renderCaret(out, newCol)).toBe("see ^ now");
	});

	test("Markdown link", () => {
		const { line, col } = withCaret("go to [a link](https://x.com)^ now");
		const plan = planDeleteBackward(line, col)!;
		const { line: out, col: newCol } = applyLineEdit(line, plan);
		expect(renderCaret(out, newCol)).toBe("go to ^ now");
	});

	test("absorbs spaces between link and cursor", () => {
		const { line, col } = withCaret("[[link]] ^ to a page");
		const plan = planDeleteBackward(line, col)!;
		const { line: out, col: newCol } = applyLineEdit(line, plan);
		expect(renderCaret(out, newCol)).toBe("^ to a page");
	});

	test("multiple spaces between link and cursor", () => {
		const { line, col } = withCaret("[[link]]   ^ rest");
		const plan = planDeleteBackward(line, col)!;
		const { line: out, col: newCol } = applyLineEdit(line, plan);
		expect(renderCaret(out, newCol)).toBe("^ rest");
	});

	test("does not trigger when only a non-link word precedes", () => {
		const { line, col } = withCaret("hello world^");
		expect(planDeleteBackward(line, col)).toBeNull();
	});

	test("does not trigger when cursor is inside the link", () => {
		const { line, col } = withCaret("a [[li^nk]] b");
		expect(planDeleteBackward(line, col)).toBeNull();
	});
});

describe("SPEC examples — Delete deletes a link to the right", () => {
	test("wikilink immediately after the caret", () => {
		const { line, col } = withCaret("this is a ^[[link]] to a page");
		const plan = planDeleteForward(line, col)!;
		const { line: out, col: newCol } = applyLineEdit(line, plan);
		expect(renderCaret(out, newCol)).toBe("this is a ^ to a page");
	});

	test("Markdown link after some spaces", () => {
		const { line, col } = withCaret("hi^   [text](url) end");
		const plan = planDeleteForward(line, col)!;
		const { line: out, col: newCol } = applyLineEdit(line, plan);
		expect(renderCaret(out, newCol)).toBe("hi^ end");
	});

	test("does not trigger when cursor is inside the link", () => {
		const { line, col } = withCaret("a [[li^nk]] b");
		expect(planDeleteForward(line, col)).toBeNull();
	});
});

describe("Word-wise arrow movement skips over links", () => {
	test("Left jumps to the start of a preceding wikilink", () => {
		const { line, col } = withCaret("a [[link]]^ b");
		const target = planMoveLeft(line, col);
		expect(target).toBe(2); // the "[" of "[[link]]"
	});

	test("Left jumps over spaces and a preceding link", () => {
		const { line, col } = withCaret("a [[link]]   ^ b");
		const target = planMoveLeft(line, col);
		expect(target).toBe(2);
	});

	test("Right jumps to the end of a following Markdown link", () => {
		const { line, col } = withCaret("a ^[hello](u) b");
		const target = planMoveRight(line, col);
		// "a " is 2 chars; link "[hello](u)" is 10 chars → end at col 12
		expect(target).toBe(12);
	});

	test("does not intervene inside a link", () => {
		const { line, col } = withCaret("a [[li^nk]] b");
		expect(planMoveLeft(line, col)).toBeNull();
		expect(planMoveRight(line, col)).toBeNull();
	});

	test("does not intervene when there is no adjacent link", () => {
		const { line, col } = withCaret("hello ^world");
		expect(planMoveLeft(line, col)).toBeNull();
		expect(planMoveRight(line, col)).toBeNull();
	});
});

describe("Word-wise Left skips links separated by any non-word characters", () => {
	test("cursor directly after a trailing comma", () => {
		const { line, col } = withCaret("Here's [[the bug]],^ rest");
		expect(planMoveLeft(line, col)).toBe(7); // start of '[[the bug]]'
	});

	test("cursor after space that follows a trailing comma", () => {
		const { line, col } = withCaret("Here's [[the bug]], ^rest");
		expect(planMoveLeft(line, col)).toBe(7);
	});

	test("cursor after a trailing period", () => {
		const { line, col } = withCaret("See [[this]].^ ok");
		expect(planMoveLeft(line, col)).toBe(4);
	});

	test("cursor after multiple trailing punctuation chars", () => {
		const { line, col } = withCaret("[[link]]...^ rest");
		expect(planMoveLeft(line, col)).toBe(0);
	});

	test("cursor after trailing parenthesis and question mark", () => {
		// User's reported case: ([[link]]?)
		const { line, col } = withCaret("([[link]]?)^ end");
		expect(planMoveLeft(line, col)).toBe(1); // start of '[[link]]'
	});

	test("does not trigger when a non-link word precedes the non-word chars", () => {
		const { line, col } = withCaret("hello world,^ more");
		expect(planMoveLeft(line, col)).toBeNull();
	});
});

describe("Word-wise Right skips links separated by any non-word characters", () => {
	test("cursor directly before a leading comma", () => {
		const { line, col } = withCaret("foo ^,[[the link]] bar");
		// "foo ,[[the link]]" — [[the link]] is 12 chars starting at 5, ends at 17
		expect(planMoveRight(line, col)).toBe(17);
	});

	test("cursor before a space that precedes a leading comma", () => {
		const { line, col } = withCaret("foo^ ,[[the link]] bar");
		expect(planMoveRight(line, col)).toBe(17);
	});

	test("cursor before a leading period", () => {
		const { line, col } = withCaret("ok^.[[this]] end");
		// "ok.[[this]]" — [[this]] is 8 chars starting at 3, ends at 11
		expect(planMoveRight(line, col)).toBe(11);
	});

	test("cursor before multiple leading punctuation chars", () => {
		const { line, col } = withCaret("^...[[link]] rest");
		// "...[[link]]" — [[link]] is 8 chars starting at 3, ends at 11
		expect(planMoveRight(line, col)).toBe(11);
	});

	test("cursor before leading parenthesis", () => {
		// Symmetric case: ,(([[link]]
		const { line, col } = withCaret("foo ^(([[link]]) bar");
		// "(([[link]]" — [[link]] starts at 6, ends at 14
		expect(planMoveRight(line, col)).toBe(14);
	});

	test("does not trigger when a non-link word follows the non-word chars", () => {
		const { line, col } = withCaret("more ,^world end");
		expect(planMoveRight(line, col)).toBeNull();
	});
});
