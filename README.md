# Treat Links Like Words

An [Obsidian](https://obsidian.md) plugin that makes wikilinks and Markdown
links behave as **a single word** when you use word-wise cursor movement,
selection, and deletion.

| Action                          | Mac default      | Windows / Linux default |
| ------------------------------- | ---------------- | ----------------------- |
| Jump cursor by word             | `Option+←/→`     | `Ctrl+←/→`              |
| Extend selection by word        | `Shift+Option+←/→` | `Shift+Ctrl+←/→`      |
| Delete previous word            | `Option+Backspace` | `Ctrl+Backspace`      |
| Delete next word                | `Option+Delete`  | `Ctrl+Delete`           |

With this plugin enabled, those shortcuts treat an entire link
(e.g. `[[some/folder/page#heading|alias]]` or `[caption](https://example.com)`)
as a single word. The plugin uses `Option` on macOS and `Ctrl` on
Windows/Linux, matching the OS / Obsidian convention for word-wise navigation.

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

Spaces between the cursor and the link are absorbed, but tabs and newlines
are not — the plugin only acts when the link is immediately adjacent or
separated by ordinary spaces.

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
3. Copy the folder containing `main.js`, `manifest.json`, and (optionally)
   `styles.css` into your vault under
   `<your-vault>/.obsidian/plugins/treat-links-like-words/`.
4. In Obsidian, open **Settings → Community plugins**, refresh the list, and
   enable **Treat Links Like Words**.

A pre-built `main.js` is also included in this repository, so you can skip
steps 1–2 and copy the repo's files directly.

## Development

```sh
npm install      # install deps
npm run dev      # watch-build main.js
npm run build    # type-check and produce production main.js
npm test         # run the Jest test suite
```

The plugin's link-detection logic lives in `src/linkUtils.ts` as pure
functions and is unit-tested in `tests/`.

## How it works

The plugin registers a CodeMirror 6 keymap extension. Each binding is bound
to both the macOS form (`Alt-…`) and the non-macOS form (`Ctrl-…`); CodeMirror
picks the right one at runtime, so the plugin always matches the OS-level
convention for the word-jump modifier. When a binding fires, the plugin:

1. Finds the cursor's line and column.
2. Looks for a link adjacent to the cursor — possibly across one or more
   ordinary space characters, but never across tabs or newlines.
3. If the cursor is *inside* a link, it returns `false` so the editor's
   default behavior runs.
4. Otherwise it dispatches a transaction that either deletes the link
   (and any spaces between it and the cursor) or moves/extends the
   selection past the link.

## License

MIT © Michael Pipolo &lt;mapipolo@gmail.com&gt;
