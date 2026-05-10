const { Plugin, Platform } = require("obsidian");
const { EditorSelection } = require("@codemirror/state");
const { EditorView } = require("@codemirror/view");

class AdjacentLinkDeletePlugin extends Plugin {
	onload() {
		this.registerEditorExtension(
			EditorView.domEventHandlers({
				keydown(event, view) {
					const direction = getDeleteDirection(event);
					if (!direction) {
						return false;
					}

					return deleteAdjacentLink(view, direction);
				},
			})
		);
	}
}

function getDeleteDirection(event) {
	if (Platform.isMacOS) {
		if (event.altKey && !event.ctrlKey && !event.metaKey) {
			if (event.key === "Backspace") {
				return "backward";
			}

			if (event.key === "Delete") {
				return "forward";
			}
		}

		return null;
	}

	if (event.ctrlKey && !event.altKey && !event.metaKey) {
		if (event.key === "Backspace") {
			return "backward";
		}

		if (event.key === "Delete") {
			return "forward";
		}
	}

	return null;
}

function deleteAdjacentLink(view, direction) {
	const spec = view.state.changeByRange((range) => {
		if (!range.empty) {
			return { range };
		}

		const linkRange = findAdjacentLinkRange(view, range.from, direction);
		if (!linkRange) {
			return { range };
		}

		return {
			changes: { from: linkRange.from, to: linkRange.to, insert: "" },
			range: EditorSelection.cursor(linkRange.from),
		};
	});

	if (spec.changes.empty) {
		return false;
	}

	view.dispatch(
		view.state.update(spec, {
			scrollIntoView: true,
			userEvent: direction === "backward" ? "delete.backward" : "delete.forward",
		})
	);

	return true;
}

function findAdjacentLinkRange(view, position, direction) {
	const line = view.state.doc.lineAt(position);
	const offset = position - line.from;

	if (direction === "backward") {
		const beforeCursor = line.text.slice(0, offset);
		const trailingSpaces = countTrailingSpaces(beforeCursor);
		const candidate = beforeCursor.slice(0, beforeCursor.length - trailingSpaces);
		const match = matchLinkAtEnd(candidate);
		if (!match) {
			return null;
		}

		return {
			from: line.from + candidate.length - match.length,
			to: line.from + candidate.length,
		};
	}

	const afterCursor = line.text.slice(offset);
	const leadingSpaces = countLeadingSpaces(afterCursor);
	const candidate = afterCursor.slice(leadingSpaces);
	const match = matchLinkAtStart(candidate);
	if (!match) {
		return null;
	}

	return {
		from: position + leadingSpaces,
		to: position + leadingSpaces + match.length,
	};
}

function countTrailingSpaces(text) {
	const match = text.match(/ *$/);
	return match ? match[0].length : 0;
}

function countLeadingSpaces(text) {
	const match = text.match(/^ */);
	return match ? match[0].length : 0;
}

function matchLinkAtEnd(text) {
	const wikilinkMatch = text.match(/\[\[[^\]\n]+(?:\|[^\]\n]+)?\]\]$/);
	if (wikilinkMatch) {
		return wikilinkMatch[0];
	}

	const markdownMatch = text.match(/\[[^\]\n]+\]\([^\)\n]+\)$/);
	if (markdownMatch) {
		return markdownMatch[0];
	}

	return null;
}

function matchLinkAtStart(text) {
	const wikilinkMatch = text.match(/^\[\[[^\]\n]+(?:\|[^\]\n]+)?\]\]/);
	if (wikilinkMatch) {
		return wikilinkMatch[0];
	}

	const markdownMatch = text.match(/^\[[^\]\n]+\]\([^\)\n]+\)/);
	if (markdownMatch) {
		return markdownMatch[0];
	}

	return null;
}

module.exports = AdjacentLinkDeletePlugin;
