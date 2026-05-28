var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => TreatLinksLikeWordsPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_view = require("@codemirror/view");

// src/linkUtils.ts
var LINK_PATTERN = /\[\[[^[\]\n]+?\]\]|\[[^[\]\n]*?\]\([^)\n]*?\)/g;
function findLinksInLine(line) {
  const out = [];
  LINK_PATTERN.lastIndex = 0;
  let m;
  while ((m = LINK_PATTERN.exec(line)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length });
  }
  return out;
}
function linkContaining(line, pos) {
  for (const r of findLinksInLine(line)) {
    if (pos > r.start && pos < r.end)
      return r;
  }
  return null;
}
function linkBefore(line, pos) {
  let i = pos;
  while (i > 0 && line.charAt(i - 1) === " ")
    i--;
  const spaces = pos - i;
  if (i === 0)
    return null;
  for (const r of findLinksInLine(line)) {
    if (r.end === i)
      return { range: r, spacesBetween: spaces };
  }
  return null;
}
function linkAfter(line, pos) {
  let i = pos;
  while (i < line.length && line.charAt(i) === " ")
    i++;
  const spaces = i - pos;
  if (i === line.length)
    return null;
  for (const r of findLinksInLine(line)) {
    if (r.start === i)
      return { range: r, spacesBetween: spaces };
  }
  return null;
}
function planDeleteBackward(line, col) {
  if (linkContaining(line, col))
    return null;
  const hit = linkBefore(line, col);
  if (!hit)
    return null;
  return { from: hit.range.start, to: col };
}
function planDeleteForward(line, col) {
  if (linkContaining(line, col))
    return null;
  const hit = linkAfter(line, col);
  if (!hit)
    return null;
  return { from: col, to: hit.range.end };
}
function planMoveLeft(line, col) {
  if (linkContaining(line, col))
    return null;
  const links = findLinksInLine(line);
  for (let i = links.length - 1; i >= 0; i--) {
    const r = links[i];
    if (r.end > col)
      continue;
    if (/^\W*$/.test(line.slice(r.end, col)))
      return r.start;
  }
  return null;
}
function planMoveRight(line, col) {
  if (linkContaining(line, col))
    return null;
  for (const r of findLinksInLine(line)) {
    if (r.start < col)
      continue;
    if (/^\W*$/.test(line.slice(col, r.start)))
      return r.end;
  }
  return null;
}

// main.ts
function getCursorContext(view) {
  const sel = view.state.selection;
  if (sel.ranges.length !== 1)
    return null;
  const r = sel.ranges[0];
  if (!r.empty)
    return null;
  const lineObj = view.state.doc.lineAt(r.head);
  return {
    line: lineObj.text,
    lineFrom: lineObj.from,
    col: r.head - lineObj.from
  };
}
function getHeadContext(view) {
  const sel = view.state.selection;
  if (sel.ranges.length !== 1)
    return null;
  const r = sel.ranges[0];
  const lineObj = view.state.doc.lineAt(r.head);
  return {
    anchor: r.anchor,
    head: r.head,
    line: lineObj.text,
    lineFrom: lineObj.from,
    col: r.head - lineObj.from
  };
}
function deleteWordBackwardOverLink(view) {
  const ctx = getCursorContext(view);
  if (!ctx)
    return false;
  const plan = planDeleteBackward(ctx.line, ctx.col);
  if (!plan)
    return false;
  const from = ctx.lineFrom + plan.from;
  const to = ctx.lineFrom + plan.to;
  view.dispatch({
    changes: { from, to, insert: "" },
    selection: { anchor: from },
    userEvent: "delete.word.backward"
  });
  return true;
}
function deleteWordForwardOverLink(view) {
  const ctx = getCursorContext(view);
  if (!ctx)
    return false;
  const plan = planDeleteForward(ctx.line, ctx.col);
  if (!plan)
    return false;
  const from = ctx.lineFrom + plan.from;
  const to = ctx.lineFrom + plan.to;
  view.dispatch({
    changes: { from, to, insert: "" },
    selection: { anchor: from },
    userEvent: "delete.word.forward"
  });
  return true;
}
function moveWordLeftOverLink(view) {
  const ctx = getCursorContext(view);
  if (!ctx)
    return false;
  const targetCol = planMoveLeft(ctx.line, ctx.col);
  if (targetCol === null)
    return false;
  view.dispatch({
    selection: { anchor: ctx.lineFrom + targetCol },
    scrollIntoView: true
  });
  return true;
}
function moveWordRightOverLink(view) {
  const ctx = getCursorContext(view);
  if (!ctx)
    return false;
  const targetCol = planMoveRight(ctx.line, ctx.col);
  if (targetCol === null)
    return false;
  view.dispatch({
    selection: { anchor: ctx.lineFrom + targetCol },
    scrollIntoView: true
  });
  return true;
}
function selectWordLeftOverLink(view) {
  const ctx = getHeadContext(view);
  if (!ctx)
    return false;
  const targetCol = planMoveLeft(ctx.line, ctx.col);
  if (targetCol === null)
    return false;
  view.dispatch({
    selection: { anchor: ctx.anchor, head: ctx.lineFrom + targetCol },
    scrollIntoView: true
  });
  return true;
}
function selectWordRightOverLink(view) {
  const ctx = getHeadContext(view);
  if (!ctx)
    return false;
  const targetCol = planMoveRight(ctx.line, ctx.col);
  if (targetCol === null)
    return false;
  view.dispatch({
    selection: { anchor: ctx.anchor, head: ctx.lineFrom + targetCol },
    scrollIntoView: true
  });
  return true;
}
function buildKeymap() {
  const mk = (winKey, macKey, run) => ({ key: winKey, mac: macKey, run, preventDefault: true });
  return [
    mk("Ctrl-Backspace", "Alt-Backspace", deleteWordBackwardOverLink),
    mk("Ctrl-Delete", "Alt-Delete", deleteWordForwardOverLink),
    mk("Ctrl-ArrowLeft", "Alt-ArrowLeft", moveWordLeftOverLink),
    mk("Ctrl-ArrowRight", "Alt-ArrowRight", moveWordRightOverLink),
    mk("Ctrl-Shift-ArrowLeft", "Alt-Shift-ArrowLeft", selectWordLeftOverLink),
    mk("Ctrl-Shift-ArrowRight", "Alt-Shift-ArrowRight", selectWordRightOverLink)
  ];
}
var TreatLinksLikeWordsPlugin = class extends import_obsidian.Plugin {
  async onload() {
    const ext = import_view.keymap.of(buildKeymap());
    this.registerEditorExtension(ext);
  }
};
