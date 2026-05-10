I want an [[Obsidian]] plugin that will make entire links (wikilinks and Markdown links) act like single words when I use the "option" (Mac) or Ctrl (Windows) keys to make the arrow keys operate in word-sized increments. When selecting, it would select the entire link with one keystroke. When deleting, it would delete the entire link with one press of Backspace or Delete, as if the link were one single word.

Make sure that it supports both wikilinks (with aliases, and with folder paths and separators) and Markdown links.

Don't hard-code any modifier key bindings: instead, obey the OS-level setting for which key causes the arrow keys to jump a word at a time (whether that's Option, or something else).

Name the plugin "Treat Links Like Words". Put files into the usual arrangement so I can drag and drop the plugin into my Obsidian. Include a README and package.json. Author is Michael Pipolo, mapipolo@gmail.com.

# Tests
Make some tests to verify that it works properly. Examples:

- If my cursor is at the caret position in "this is a [[link]]^ to a page", and I press Ctrl+Backspace, I would get "this is a ^ to a page". Similarly if the cursor is in front of the link and I press Ctrl+Delete. 
- Support Markdown links ([a link](the url)) and wikilinks ([[wikilink]]).
- Make sure to support aliases in the wikilinks: [[this page|this is an alias]]. 
- It works the same if there's nothing but space letters between the cursor and the link. E.g., "[[link]] ^ to a page": pressing backspace there would also delete the whole link and the space in front of it. (Don't do this for newlines or tabs; only spaces.)