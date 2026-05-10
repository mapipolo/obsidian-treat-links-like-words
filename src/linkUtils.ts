/**
 * Pure helpers for finding wikilinks and Markdown links adjacent to a cursor.
 *
 * A "link" is either:
 *   - A wikilink:    [[target]] or [[target|alias]]  (target may contain "/" or "#")
 *   - A Markdown link: [text](url)                   (text and url are non-greedy)
 *
 * These helpers know nothing about CodeMirror or Obsidian; they operate on
 * plain strings and offsets so they can be tested in isolation.
 */

export interface LinkRange {
	/** Inclusive start offset of the link in the line. */
	start: number;
	/** Exclusive end offset of the link in the line. */
	end: number;
}

// Wikilink: [[ ... ]] where the inside contains no "[" or "]" or newline.
// Markdown link: [text](url) where text contains no "[" or "]" or newline,
// and url contains no ")" or newline. (Good enough for typical Obsidian content.)
const LINK_PATTERN = /\[\[[^\[\]\n]+?\]\]|\[[^\[\]\n]*?\]\([^)\n]*?\)/g;

/**
 * Find every link in a single line of text.
 * Caller is responsible for splitting input by "\n".
 */
export function findLinksInLine(line: string): LinkRange[] {
	const out: LinkRange[] = [];
	LINK_PATTERN.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = LINK_PATTERN.exec(line)) !== null) {
		out.push({ start: m.index, end: m.index + m[0].length });
	}
	return out;
}

/**
 * If `pos` falls strictly inside a link in `line` (not at either edge),
 * return that link. Otherwise return null. Being "inside" means the
 * cursor is between characters of the link, not at its boundary.
 */
export function linkContaining(line: string, pos: number): LinkRange | null {
	for (const r of findLinksInLine(line)) {
		if (pos > r.start && pos < r.end) return r;
	}
	return null;
}

/**
 * Find a link immediately to the LEFT of `pos`, optionally separated by
 * one or more space characters (NOT tabs or newlines — line is one line).
 * The returned range covers the link itself; use `spacesBefore` to know
 * how many spaces sit between the link's end and `pos`.
 */
export function linkBefore(
	line: string,
	pos: number
): { range: LinkRange; spacesBetween: number } | null {
	// Walk back over spaces.
	let i = pos;
	while (i > 0 && line.charAt(i - 1) === " ") i--;
	const spaces = pos - i;
	if (i === 0) return null;
	for (const r of findLinksInLine(line)) {
		if (r.end === i) return { range: r, spacesBetween: spaces };
	}
	return null;
}

/**
 * Find a link immediately to the RIGHT of `pos`, optionally separated by
 * one or more space characters. Mirror of `linkBefore`.
 */
export function linkAfter(
	line: string,
	pos: number
): { range: LinkRange; spacesBetween: number } | null {
	let i = pos;
	while (i < line.length && line.charAt(i) === " ") i++;
	const spaces = i - pos;
	if (i === line.length) return null;
	for (const r of findLinksInLine(line)) {
		if (r.start === i) return { range: r, spacesBetween: spaces };
	}
	return null;
}

// ---- High-level decisions (pure, framework-free) --------------------------

/**
 * Describes a single replacement to apply to a line: delete the text in
 * [from, to) (column offsets) and place the cursor at `from`.
 */
export interface LineEdit {
	from: number;
	to: number;
}

/**
 * Compute the effect of word-wise Backspace at `col` on `line`, but only
 * if there's a link to absorb. Returns null when the plugin should not
 * intervene (cursor inside a link, no link adjacent, etc.).
 */
export function planDeleteBackward(line: string, col: number): LineEdit | null {
	if (linkContaining(line, col)) return null;
	const hit = linkBefore(line, col);
	if (!hit) return null;
	return { from: hit.range.start, to: col };
}

/** Mirror of `planDeleteBackward` for word-wise Delete. */
export function planDeleteForward(line: string, col: number): LineEdit | null {
	if (linkContaining(line, col)) return null;
	const hit = linkAfter(line, col);
	if (!hit) return null;
	return { from: col, to: hit.range.end };
}

/**
 * Compute the new cursor column for a word-wise Left jump that should
 * skip over an adjacent link. Returns null if the plugin should not
 * intervene.
 */
export function planMoveLeft(line: string, col: number): number | null {
	if (linkContaining(line, col)) return null;
	const hit = linkBefore(line, col);
	if (!hit) return null;
	return hit.range.start;
}

/** Mirror of `planMoveLeft` for word-wise Right. */
export function planMoveRight(line: string, col: number): number | null {
	if (linkContaining(line, col)) return null;
	const hit = linkAfter(line, col);
	if (!hit) return null;
	return hit.range.end;
}

/**
 * Apply a `LineEdit` to a line, returning the new line text and the new
 * cursor column. Useful for tests that assert end-to-end behavior on a
 * single line.
 */
export function applyLineEdit(
	line: string,
	edit: LineEdit
): { line: string; col: number } {
	return {
		line: line.slice(0, edit.from) + line.slice(edit.to),
		col: edit.from,
	};
}

