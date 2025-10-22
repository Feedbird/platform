'use client'

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { sanitizePlainText } from '@/lib/utils/sanitize'
import { getCaretCharacterOffsetWithin, insertTextAtCaret, getCaretOffset } from '@/lib/utils/caret-positioning'

type MessageInputProps = {
	placeholder?: string
	onInput: (value: string, html: string) => void
	onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
	onMentionDetected: (query: string, position: { x: number; y: number }) => void
	onMentionHidden: () => void
	disabled?: boolean
}

const MessageInput = forwardRef<any, MessageInputProps>(({
	placeholder = "Type a message...",
	onInput,
	onKeyDown,
	onMentionDetected,
	onMentionHidden,
	disabled = false
}, ref) => {
	const textareaRef = useRef<HTMLDivElement>(null)
	const [input, setInput] = useState('')
	const [previousHTML, setPreviousHTML] = useState('')
	const [storedCaretPosition, setStoredCaretPosition] = useState(0)

	const MAX_TEXTAREA_HEIGHT = 324

	const adjustTextareaHeight = () => {
		const el = textareaRef.current
		if (!el) return

		el.style.height = 'auto'
		const newHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)
		el.style.height = `${newHeight}px`
		el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden'
	}

	useEffect(() => {
		adjustTextareaHeight()
	}, [input])

	const handleContentEditableInput = (e: React.FormEvent<HTMLDivElement>) => {
		const editor = e.currentTarget
		const value = editor.textContent || ''

		// Update previous HTML before changing the input
		const currentHTML = editor.innerHTML
		setPreviousHTML(currentHTML)

		setInput(value)
		onInput(value, currentHTML)

		const sel = window.getSelection()
		if (!sel || sel.rangeCount === 0) return
		const range = sel.getRangeAt(0)

		// Insert invisible marker to measure caret position
		const marker = document.createElement('span')
		marker.textContent = '\u200b' // zero-width space
		range.insertNode(marker)
		range.setStartAfter(marker)
		range.collapse(true)

		const rect = marker.getBoundingClientRect()
		const caretPos = getCaretCharacterOffsetWithin(editor)
		marker.remove()

		// Detect last '@' before caret
		const beforeCaret = value.slice(0, caretPos)
		const atIdx = beforeCaret.lastIndexOf('@')
		if (atIdx === -1) { 
			onMentionHidden()
			return 
		}

		// must be start or after whitespace
		const prevChar = atIdx > 0 ? beforeCaret[atIdx - 1] : ' '
		if (!/\s/.test(prevChar)) { 
			onMentionHidden()
			return 
		}

		// Check if this @ symbol is inside a mention span
		const htmlContent = editor.innerHTML
		let atCount = 0
		for (let i = 0; i < atIdx + 1; i++) {
			if (beforeCaret[i] === '@') {
				atCount++
			}
		}

		let currentAtCount = 0
		let isInsideSpan = false
		for (let i = 0; i < htmlContent.length; i++) {
			if (htmlContent[i] === '@') {
				currentAtCount++
				if (currentAtCount === atCount) {
					let tagStart = -1
					for (let j = i; j >= 0; j--) {
						if (htmlContent[j] === '<') {
							tagStart = j
							break
						}
					}

					if (tagStart !== -1) {
						const tagContent = htmlContent.slice(tagStart, i + 10)
						if (tagContent.includes('<span') && tagContent.includes('data-mention-type="mention"')) {
							isInsideSpan = true
						}
					}
					break
				}
			}
		}

		if (isInsideSpan) {
			onMentionHidden()
			return
		}

		// extract query and trim whitespace
		const query = beforeCaret.slice(atIdx + 1).trim();
		if (query.includes(' ')) { 
			onMentionHidden()
			return 
		}

		// Position dropdown: bottom 8px above caret
		onMentionDetected(query, { x: rect.left, y: rect.top - 8 })
	}

	const handleContentEditableKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		// Handle backspace deletion of mention spans
		if (e.key === 'Backspace') {
			const sel = window.getSelection()
			if (sel && sel.rangeCount > 0) {
				const range = sel.getRangeAt(0)
				const container = textareaRef.current as HTMLDivElement
				if (container) {
					const startContainer = range.startContainer
					const startOffset = range.startOffset

					if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
						const textNode = startContainer as Text
						const previousSibling = textNode.previousSibling

						if (previousSibling &&
							previousSibling.nodeType === Node.ELEMENT_NODE &&
							(previousSibling as Element).getAttribute('data-mention-type') === 'mention') {

							e.preventDefault();
							(previousSibling as Element).remove()
							setInput(container.textContent || '')
							container.dispatchEvent(new Event('input', { bubbles: true }))
							return
						}
					}

					let currentNode: Node | null = startContainer
					while (currentNode && currentNode !== container) {
						if (currentNode.nodeType === Node.ELEMENT_NODE &&
							(currentNode as Element).getAttribute('data-mention-type') === 'mention') {

							e.preventDefault();
							(currentNode as Element).remove()
							setInput(container.textContent || '')
							container.dispatchEvent(new Event('input', { bubbles: true }))
							return
						}
						currentNode = currentNode.parentNode
					}
				}
			}
		}

		onKeyDown(e)
	}

	const handleAtButtonClick = () => {
		const contentEditableDiv = textareaRef.current
		if (contentEditableDiv) {
			const selection = window.getSelection()
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0)
				const atNode = document.createTextNode('@')
				range.insertNode(atNode)
				range.setStartAfter(atNode)
				range.collapse(true)
				selection.removeAllRanges()
				selection.addRange(range)

				contentEditableDiv.dispatchEvent(new Event('input', { bubbles: true }))
			}
		}
	}

	const handleEmojiInsert = (emoji: string) => {
		const el = textareaRef.current as HTMLElement | null;
		if (!el) return;

		insertTextAtCaret(el, emoji, storedCaretPosition ?? 0);
		setInput(el.textContent || "");
		requestAnimationFrame(() => {
			adjustTextareaHeight?.();
			el.focus();
		});
	}

	const handleMentionSelect = (member: any, mentionQuery: string) => {
		const sel = window.getSelection()
		if (!sel || sel.rangeCount === 0) return

		const container = textareaRef.current as HTMLDivElement
		if (!container) return

		const currentHTML = container.innerHTML
		const searchPattern = '@' + mentionQuery

		let atIdx = -1
		if (previousHTML && previousHTML !== currentHTML) {
			atIdx = currentHTML.indexOf(searchPattern)

			if (atIdx !== -1) {
				const patternInPrevious = previousHTML.indexOf(searchPattern)

				if (patternInPrevious === -1) {
					// This is the new @mentionQuery that was just added
				} else {
					const commonLength = Math.min(previousHTML.length, currentHTML.length)
					let lastCommonIndex = 0

					for (let i = 0; i < commonLength; i++) {
						if (previousHTML[i] !== currentHTML[i]) {
							lastCommonIndex = i
							break
						}
					}

					atIdx = currentHTML.indexOf(searchPattern, lastCommonIndex)
				}
			}
		} else {
			atIdx = currentHTML.lastIndexOf(searchPattern)
		}

		if (atIdx === -1) return

		const before = currentHTML.slice(0, atIdx)
		const after = currentHTML.slice(atIdx + searchPattern.length)

		const timestamp = Date.now()
		const sanitizedFirstName = sanitizePlainText(member.first_name || '')
		const sanitizedEmail = sanitizePlainText(member.email || '')
		const mentionSpanHTML = `<span style="background: #FE4C281A; border-radius: 4px; padding-left: 3px; padding-right: 3px; color: #FE4C28; display: inline-block;" data-mention-type="mention" data-timestamp="${timestamp}" contenteditable="false">@${sanitizedFirstName || sanitizedEmail}</span>`

		const isCaretAtEnd = after.trim() === ''
		const newHTML = before + mentionSpanHTML + after + (isCaretAtEnd ? '&nbsp;' : '')

		container.innerHTML = newHTML
		setPreviousHTML(newHTML)

		const newText = container.textContent || ''
		setInput(newText)
		onMentionHidden()

		const newRange = document.createRange()
		const mentionSpanElement = container.querySelector(`[data-timestamp="${timestamp}"]`) as HTMLElement

		if (mentionSpanElement) {
			if (isCaretAtEnd) {
				const nextSibling = mentionSpanElement.nextSibling
				if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
					newRange.setStartAfter(nextSibling)
					newRange.collapse(true)
				} else {
					newRange.setStartAfter(mentionSpanElement)
					newRange.collapse(true)
				}
			} else {
				newRange.setStartAfter(mentionSpanElement)
				newRange.collapse(true)
			}

			sel.removeAllRanges()
			sel.addRange(newRange)
		}

		container.focus()
		container.dispatchEvent(new Event('input', { bubbles: true }))
	}

	const clearInput = () => {
		setInput('')
		if (textareaRef.current) {
			textareaRef.current.innerHTML = ''
			textareaRef.current.focus()
			if (textareaRef.current.style) {
				textareaRef.current.style.height = '56px'
				textareaRef.current.style.overflowY = 'hidden'
			}
		}
	}

	const getCurrentContent = () => {
		const container = textareaRef.current as HTMLDivElement
		return container ? container.innerHTML.trim() : input.trim()
	}

	// Expose methods for parent component
	useImperativeHandle(ref, () => ({
		handleAtButtonClick,
		handleEmojiInsert,
		handleMentionSelect,
		clearInput,
		getCurrentContent,
		setStoredCaretPosition: (pos: number) => {
			setStoredCaretPosition(pos)
			if (textareaRef.current) {
				setStoredCaretPosition(getCaretOffset(textareaRef.current))
			}
		}
	}), [])

	return (
		<div className="pt-2.5 pb-4 px-2.5">
			<div
				ref={textareaRef}
				contentEditable
				suppressContentEditableWarning
				onInput={handleContentEditableInput}
				onKeyDown={handleContentEditableKeyDown}
				className="resize-none border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-0 shadow-none text-black text-sm font-normal leading-tight min-h-[56px] max-h-[314px] overflow-y-hidden"
				style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
				data-placeholder={placeholder}
			/>
			<textarea
				value={input}
				onChange={() => { }}
				className="sr-only"
				tabIndex={-1}
			/>
		</div>
	)
})

export default MessageInput