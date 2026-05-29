# Treat Links Like Words

An [Obsidian](https://obsidian.md) plugin that makes the editor treat wikilinks and Markdown links like whole words when using `Option/Ctrl+<ArrowKey>` to do wordwise editing operations: cursor movement, selection, and deletion.

| Action                          | Mac default      | Windows / Linux default |
| ------------------------------- | ---------------- | ----------------------- |
| Jump cursor by word             | `Option+←/→`     | `Ctrl+←/→`              |
| Extend selection by word        | `Shift+Option+←/→` | `Shift+Ctrl+←/→`      |
| Delete previous word            | `Option+Backspace` | `Ctrl+Backspace`      |
| Delete next word                | `Option+Delete`  | `Ctrl+Delete`           |

With this plugin enabled, those shortcuts treat an entire link (e.g. `[[note]]` or `[[some/folder/page#heading|alias]]` or `[caption](https://example.com)`)
as a single word: e.g., pressing `Option+Backspace` once when the cursor is positioned to the right of the link will delete the entire link.

## Motivation

I use the alt key to make word-wise edits frequently, and I found that in almost every case I wanted links to be treated the same as words — I almost never wanted the default behavior of stepping through a link character group by character group.

> **Note:** This plugin overrides the editor's native word-wise key bindings (`Option/Ctrl` + arrows, `Backspace`, and `Delete`) at the CodeMirror layer so it can extend them to links. When the cursor is inside a link, it falls through to the default behavior, but be aware that it intercepts these keys globally while enabled.

## Examples

```
this is a [[link]]^ to a page         (cursor at ^)
                  ↑ press Option/Ctrl+Backspace
this is a ^ to a page
```

```
this is a ^[[link]] to a page
           ↑ press Option/Ctrl+Delete
this is a ^ to a page
```

```
[[link]]   ^ to a page
           ↑ press Option/Ctrl+Backspace
^ to a page
```

The plugin treats any non-word characters (spaces, punctuation, brackets, etc.)
as transparent when determining if a link is adjacent to the cursor. This means
links like `[[link]]?,` or `,(([[link]])` are handled correctly in one keystroke.
Tabs and newlines are considered word boundaries and will not be crossed.

If the cursor is **inside** a link, the plugin does nothing and the editor's
normal word-wise behavior applies, so you can navigate within a long alias as
usual.

### Supported link forms

- `[[page]]`
- `[[folder/sub/page]]`
- `[[folder/sub/page#heading]]`
- `[[page|alias]]`
- `[[folder/sub/page#heading|alias]]`
- `[caption](https://example.com)`
- `[caption](relative/path.md)`

## Installation

### From source (drag-and-drop)

1. Clone or download this repository.
2. Run `npm install` and then `npm run build` to produce `main.js`.
3. Copy the folder containing `main.js` and `manifest.json` into your vault
   under `<your-vault>/.obsidian/plugins/treat-links-like-words/`.
4. In Obsidian, open **Settings → Community plugins**, refresh the list, and
   enable **Treat Links Like Words**.

A pre-built `main.js` is also included in this repository, so you can skip
steps 1–2 and copy the repo's files directly.

## Development

```sh
npm install      # install deps
npm run dev      # watch-build main.js
npm run build    # type-check and produce production main.js
npm test         # run the Vitest test suite
```

The plugin's link-detection logic lives in `src/linkUtils.ts` as pure
functions and is unit-tested in `test/`.

## How it works

The plugin registers a CodeMirror 6 keymap extension. Each binding is bound
to both the macOS form (`Alt-…`) and the non-macOS form (`Ctrl-…`); CodeMirror
picks the right one at runtime, so the plugin always matches the OS-level
convention for the word-jump modifier. When a binding fires, the plugin:

1. Finds the cursor's line and column.
2. Looks for a link adjacent to the cursor — checking if only non-word
   characters (spaces, punctuation, brackets, etc.) separate the cursor from
   the nearest link. Tabs and newlines are not crossed.
3. If the cursor is *inside* a link, it returns `false` so the editor's
   default behavior runs.
4. Otherwise it dispatches a transaction that either deletes the link
   (and any non-word characters between it and the cursor) or moves/extends
   the selection past the link.

## Known issues

The plugin currently treats any non-word characters (spaces, punctuation, brackets,
etc.) as transparent when determining adjacency, so links like `[[link]]?,`
or `([[link]])` are handled correctly. However, when shrinking a selection
across the endpoints of a link's punctuation "halo", the behavior is not
perfectly symmetrical in all cases. Specifically, expanding and then
shrinking a selection may not always land the head at identical positions
depending on the direction and the precise mix of punctuation.
