import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { type?: 'info' | 'warning' | 'success' }) => ReturnType
      toggleCallout: (attrs?: { type?: 'info' | 'warning' | 'success' }) => ReturnType
      unsetCallout: () => ReturnType
    }
  }
}

export const CalloutNode = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,
  addAttributes() {
    return {
      type: {
        default: 'info',
        renderHTML: (attrs) => ({ 'data-type': attrs.type }),
        parseHTML: (element) => element.getAttribute('data-type') || 'info',
      },
    }
  },
  parseHTML() {
    return [
      { tag: 'div[data-callout]' },
    ]
  },
  renderHTML({ HTMLAttributes, node }) {
    const type = (node.attrs.type || 'info') as 'info' | 'warning' | 'success'
    const styleMap: Record<string, string> = {
      info: 'background-color:#eff6ff;border-color:#bfdbfe;color:#1e3a8a',
      warning: 'background-color:#fffbeb;border-color:#fde68a;color:#7c2d12',
      success: 'background-color:#ecfdf5;border-color:#a7f3d0;color:#064e3b',
    }
    const iconMap: Record<string, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
    }
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '', style: `${styleMap[type]};border-width:1px;border-radius:8px;padding:12px;display:flex;gap:8px;align-items:flex-start;` }),
      ['span', { 'aria-hidden': 'true', style: 'font-size:16px;line-height:1.2;margin-top:2px;' }, iconMap[type]],
      ['div', { style: 'flex:1 1 auto;' }, 0],
    ]
  },
  addCommands() {
    return {
      setCallout:
        (attrs) => ({ commands }) =>
          commands.insertContent({ type: this.name, attrs, content: [{ type: 'paragraph' }] }),
      toggleCallout:
        (attrs) => ({ commands, state }) => {
          const { $from } = state.selection
          if ($from.parent.type.name === this.name) {
            return commands.lift(this.name)
          }
          return commands.insertContent({ type: this.name, attrs, content: [{ type: 'paragraph' }] })
        },
      unsetCallout:
        () => ({ commands }) => commands.clearNodes(),
    }
  },
})


