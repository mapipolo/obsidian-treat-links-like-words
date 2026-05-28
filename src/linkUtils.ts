export interface LinkRange {
	start: number; // inclusive
	end: number;   // exclusive
}

// text/url are non-greedy; no "[", "]", ")", or newline inside to avoid over-matching
const LINK_PATTERN = /\[\[[^\[\]\n]+?\]\]|\[[^\[\]\n]*?\]\([^)\n]*?\)/g;

export function findLinksInLine(line: string): LinkRange[] {
	const out: LinkRange[] = [];
	LINK_PATTERN.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = LINK_PATTERN.exec(line)) !== null) {
		out.push({ start: m.index, end: m.index + m[0].length });
	}
	return out;
}

export function linkContaining(line: string, pos: number): LinkRange | null {
	for (const r of findLinksInLine(line)) {
		if (pos > r.start && pos < r.end) return r;
	}
	return null;
}

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

export interface LineEdit {
	from: number;
	to: number;
}

export function planDeleteBackward(line: string, col: number): LineEdit | null {
	if (linkContaining(line, col)) return null;
	const hit = linkBefore(line, col);
	if (!hit) return null;
	return { from: hit.range.start, to: col };
}

export function planDeleteForward(line: string, col: number): LineEdit | null {
	if (linkContaining(line, col)) return null;
	const hit = linkAfter(line, col);
	if (!hit) return null;
	return { from: col, to: hit.range.end };
}

// \W* adjacency: cross spaces, punctuation, brackets — but not tabs or word chars
export function planMoveLeft(line: string, col: number): number | null {
	if (linkContaining(line, col)) return null;
	const links = findLinksInLine(line);
	// Iterate right-to-left so we find the nearest link first.
	for (let i = links.length - 1; i >= 0; i--) {
		const r = links[i];
		if (r.end > col) continue; // link is to the right of the cursor
		if (/^\W*$/.test(line.slice(r.end, col))) return r.start;
	}
	return null;
}

export function planMoveRight(line: string, col: number): number | null {
	if (linkContaining(line, col)) return null;
	// Iterate left-to-right so we find the nearest link first.
	for (const r of findLinksInLine(line)) {
		if (r.start < col) continue; // link is to the left of the cursor
		if (/^\W*$/.test(line.slice(col, r.start))) return r.end;
	}
	return null;
}

export function applyLineEdit(
	line: string,
	edit: LineEdit
): { line: string; col: number } {
	return {
		line: line.slice(0, edit.from) + line.slice(edit.to),
		col: edit.from,
	};
}

