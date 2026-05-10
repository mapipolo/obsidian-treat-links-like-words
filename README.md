# Adjacent Link Delete

An Obsidian plugin that makes word-delete shortcuts treat adjacent links as a single unit.

## What it does

When the cursor is immediately next to a link, or separated from it only by plain spaces on the same line, the plugin deletes the entire link instead of deleting one word at a time.

Supported link formats:

- Wikilinks: `[[page]]`
- Wikilinks with aliases: `[[page|alias]]`
- Markdown links: `[label](https://example.com)`

Supported shortcuts:

- macOS:
  - `Option-Backspace` deletes an adjacent link before the cursor
  - `Option-Delete` deletes an adjacent link after the cursor
- Windows/Linux:
  - `Ctrl-Backspace` deletes an adjacent link before the cursor
  - `Ctrl-Delete` deletes an adjacent link after the cursor

## Examples

Backward delete:

```text
this is a [[link]]^ to a page
```

becomes:

```text
this is a ^ to a page
```

Forward delete:

```text
this is a ^[[link]] to a page
```

becomes:

```text
this is a ^ to a page
```

The same behavior works for:

```text
[[this page|has an alias]]
[a link](the-url)
```

It also works when only spaces separate the cursor and the link:

```text
[[link]] ^ to a page
^ [[link]] to a page
```

Tabs and newlines are not treated as adjacent.

## Installation

1. Copy the `adjacent-link-delete` folder into your vault's `.obsidian/plugins/` directory.
2. Open Obsidian.
3. Go to `Settings -> Community plugins`.
4. Enable `Adjacent Link Delete`.

## Development notes

This plugin is intentionally buildless. The source file is `main.js`, which Obsidian loads directly.
