// Utility functions for caret positioning in contentEditable elements

export function getCaretCharacterOffsetWithin(element: HTMLElement): number {
	const sel = window.getSelection()
	if (!sel || sel.rangeCount === 0) return 0
	const range = sel.getRangeAt(0)

	let preCaretRange = range.cloneRange()
	preCaretRange.selectNodeContents(element)
	preCaretRange.setEnd(range.endContainer, range.endOffset)

	return preCaretRange.toString().length
}

export function getCaretOffset(el: HTMLElement): number {
	const sel = window.getSelection();
	if (!sel || sel.rangeCount === 0) return 0;
	const range = sel.getRangeAt(0);
	if (!el.contains(range.startContainer)) return 0;

	const pre = range.cloneRange();
	pre.selectNodeContents(el);
	pre.setEnd(range.startContainer, range.startOffset);
	return pre.toString().length;
}

export function insertTextAtCaret(el: HTMLElement, text: string, fallbackVisualIndex?: number) {
	const sel = window.getSelection();
	let range: Range | null = null;

	if (sel && sel.rangeCount && el.contains(sel.anchorNode)) {
		range = sel.getRangeAt(0);
	} else {
		const mapped = visualToEditableOffset(el, Math.max(0, fallbackVisualIndex ?? 0));
		setCaretOffset(el, mapped);
		const sel2 = window.getSelection();
		range = sel2 && sel2.rangeCount ? sel2.getRangeAt(0) : null;
	}

	if (!range) return;

	range.deleteContents();
	const node = document.createTextNode(text);
	range.insertNode(node);
	el.normalize();

	const newRange = document.createRange();
	newRange.setStart(node, node.nodeValue!.length);
	newRange.collapse(true);
	const sel3 = window.getSelection();
	sel3?.removeAllRanges();
	sel3?.addRange(newRange);
}

export function visualToEditableOffset(el: HTMLElement, visualIndex: number): number {
	const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);

	let visualSoFar = 0;
	let editableSoFar = 0;
	let node: Node | null = walker.nextNode();

	const isInNonEditable = (n: Node) => {
		let cur: HTMLElement | null =
			n.nodeType === Node.TEXT_NODE ? (n.parentElement as HTMLElement | null) : (n as HTMLElement | null);
		while (cur && cur !== el) {
			if (cur.getAttribute?.('contenteditable') === 'false' || (cur as any).dataset?.mentionType === 'mention') {
				return true;
			}
			cur = cur.parentElement;
		}
		return false;
	};

	while (node) {
		const len = node.textContent?.length ?? 0;
		const insideNE = isInNonEditable(node);

		if (visualSoFar + len >= visualIndex) {
			if (insideNE) {
				return editableSoFar;
			}
			return editableSoFar + (visualIndex - visualSoFar);
		}

		visualSoFar += len;
		if (!insideNE) editableSoFar += len;
		node = walker.nextNode();
	}

	return editableSoFar;
}

export function setCaretOffset(el: HTMLElement, index: number) {
	const walker = createEditableTextWalker(el);
	let remaining = index;
	let node: Node | null = walker.nextNode();
	while (node) {
		const text = node.textContent || "";
		if (remaining <= text.length) {
			const range = document.createRange();
			const sel = window.getSelection();
			range.setStart(node, remaining);
			range.collapse(true);
			sel?.removeAllRanges();
			sel?.addRange(range);
			return;
		}
		remaining -= text.length;
		node = walker.nextNode();
	}
	const range = document.createRange();
	const sel = window.getSelection();
	range.selectNodeContents(el);
	range.collapse(false);
	sel?.removeAllRanges();
	sel?.addRange(range);
}

export function createEditableTextWalker(root: HTMLElement) {
	const filter = {
		acceptNode(node: Node) {
			return closestNonEditable(node, root) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
		},
	} as unknown as NodeFilter;
	return document.createTreeWalker(root, NodeFilter.SHOW_TEXT, filter);
}

export function closestNonEditable(node: Node, root: HTMLElement): HTMLElement | null {
	let el: HTMLElement | null =
		node.nodeType === Node.TEXT_NODE ? (node.parentElement as HTMLElement | null) : (node as HTMLElement | null);
	while (el && el !== root) {
		if (
			el.getAttribute?.("contenteditable") === "false" ||
			(el as any).dataset?.mentionType === "mention"
		) {
			return el;
		}
		el = el.parentElement;
	}
	return null;
}
