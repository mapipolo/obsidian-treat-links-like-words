import { Plugin } from "obsidian";
import { Extension } from "@codemirror/state";
import { EditorView, KeyBinding, keymap } from "@codemirror/view";
import {
	planDeleteBackward,
	planDeleteForward,
	planMoveLeft,
	planMoveRight,
} from "./src/linkUtils";

interface CursorContext {
	line: string;
	lineFrom: number; // absolute doc offset of column 0
	col: number;     // cursor column within line
}

function getCursorContext(view: EditorView): CursorContext | null {
	const sel = view.state.selection;
	if (sel.ranges.length !== 1) return null;
	const r = sel.ranges[0];
	if (!r.empty) return null;
	const lineObj = view.state.doc.lineAt(r.head);
	return {
		line: lineObj.text,
		lineFrom: lineObj.from,
		col: r.head - lineObj.from,
	};
}

// allows non-empty selections — used for shift+arrow extensions
function getHeadContext(view: EditorView) {
	const sel = view.state.selection;
	if (sel.ranges.length !== 1) return null;
	const r = sel.ranges[0];
	const lineObj = view.state.doc.lineAt(r.head);
	return {
		anchor: r.anchor,
		head: r.head,
		line: lineObj.text,
		lineFrom: lineObj.from,
		col: r.head - lineObj.from,
	};
}

// ---- Commands ---------------------------------------------------------------

function deleteWordBackwardOverLink(view: EditorView): boolean {
	const ctx = getCursorContext(view);
	if (!ctx) return false;
	const plan = planDeleteBackward(ctx.line, ctx.col);
	if (!plan) return false;
	const from = ctx.lineFrom + plan.from;
	const to = ctx.lineFrom + plan.to;
	view.dispatch({
		changes: { from, to, insert: "" },
		selection: { anchor: from },
		userEvent: "delete.word.backward",
	});
	return true;
}

function deleteWordForwardOverLink(view: EditorView): boolean {
	const ctx = getCursorContext(view);
	if (!ctx) return false;
	const plan = planDeleteForward(ctx.line, ctx.col);
	if (!plan) return false;
	const from = ctx.lineFrom + plan.from;
	const to = ctx.lineFrom + plan.to;
	view.dispatch({
		changes: { from, to, insert: "" },
		selection: { anchor: from },
		userEvent: "delete.word.forward",
	});
	return true;
}

function moveWordLeftOverLink(view: EditorView): boolean {
	const ctx = getCursorContext(view);
	if (!ctx) return false;
	const targetCol = planMoveLeft(ctx.line, ctx.col);
	if (targetCol === null) return false;
	view.dispatch({
		selection: { anchor: ctx.lineFrom + targetCol },
		scrollIntoView: true,
	});
	return true;
}

function moveWordRightOverLink(view: EditorView): boolean {
	const ctx = getCursorContext(view);
	if (!ctx) return false;
	const targetCol = planMoveRight(ctx.line, ctx.col);
	if (targetCol === null) return false;
	view.dispatch({
		selection: { anchor: ctx.lineFrom + targetCol },
		scrollIntoView: true,
	});
	return true;
}

function selectWordLeftOverLink(view: EditorView): boolean {
	const ctx = getHeadContext(view);
	if (!ctx) return false;
	const targetCol = planMoveLeft(ctx.line, ctx.col);
	if (targetCol === null) return false;
	view.dispatch({
		selection: { anchor: ctx.anchor, head: ctx.lineFrom + targetCol },
		scrollIntoView: true,
	});
	return true;
}

function selectWordRightOverLink(view: EditorView): boolean {
	const ctx = getHeadContext(view);
	if (!ctx) return false;
	const targetCol = planMoveRight(ctx.line, ctx.col);
	if (targetCol === null) return false;
	view.dispatch({
		selection: { anchor: ctx.anchor, head: ctx.lineFrom + targetCol },
		scrollIntoView: true,
	});
	return true;
}

// ---- Keymap -----------------------------------------------------------------

// CM's "Mod" is Cmd/Ctrl; word-movement needs Alt on Mac + Ctrl elsewhere, so we use the Mac field.
function buildKeymap(): KeyBinding[] {
	const mk = (
		winKey: string,
		macKey: string,
		run: (v: EditorView) => boolean
	): KeyBinding => ({ key: winKey, mac: macKey, run, preventDefault: true });

	return [
		mk("Ctrl-Backspace", "Alt-Backspace", deleteWordBackwardOverLink),
		mk("Ctrl-Delete",    "Alt-Delete",    deleteWordForwardOverLink),
		mk("Ctrl-ArrowLeft", "Alt-ArrowLeft", moveWordLeftOverLink),
		mk("Ctrl-ArrowRight","Alt-ArrowRight",moveWordRightOverLink),
		mk("Ctrl-Shift-ArrowLeft",  "Alt-Shift-ArrowLeft",  selectWordLeftOverLink),
		mk("Ctrl-Shift-ArrowRight", "Alt-Shift-ArrowRight", selectWordRightOverLink),
	];
}

// ---- Plugin -----------------------------------------------------------------

export default class TreatLinksLikeWordsPlugin extends Plugin {
	async onload() {
		const ext: Extension = keymap.of(buildKeymap());
		this.registerEditorExtension(ext);
	}
}
