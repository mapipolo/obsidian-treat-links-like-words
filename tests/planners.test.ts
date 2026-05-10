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
