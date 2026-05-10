# Prompts

## Prompt 1

make an Obsidian plugin that will allow me to use Ctrl/Cmd-Backspace and Ctrl/Cmd-Delete to delete an entire link when the cursor is adjacent to it.

## Prompt 2

i.e., if my cursor is at the caret position in "this is a [[link]]^ to a page", and I press Ctrl+Backspace, I would get "this is a ^ to a page". Similarly if the cursor is in front of the link and I press Ctrl+Delete. Use Option on Mac per usual (not cmd, i made  a mistake earlier). Support Markdown links ([a link](the url)) and wikilinks ([[wikilink]]). Also make sure to support aliases in the wikilinks: [[this page|has an alias]]. Put the files in the usual arrangement so that I can drag and drop the plugin into my Obsidian.

## Prompt 3

yeah go ahead and add the README and package.json with reasonable explanations

## Prompt 4

one tweak: make it also work if there is nothing but space letters between the cursor and the link. e.g., "[[link]] ^ to a page": that would also delete the whole link because it's just a space character. Don't do this for newlines or tabs.

## Prompt 5

take my prompts and put them into a Markdown file so I can remember how I asked for this. just my prompts.
