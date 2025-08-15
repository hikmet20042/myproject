import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'
import { Node as PMNode } from 'prosemirror-model'

const key = new PluginKey('blockHandle')

function isBlock(node: PMNode): boolean {
  return node.isBlock
}

function getBlockInfo(view: EditorView, pos: number) {
  const $pos = view.state.doc.resolve(pos)
  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d)
    const before = $pos.before(d)
    const after = before + node.nodeSize
    if (isBlock(node)) {
      return { node, from: before, to: after, depth: d }
    }
  }
  const node = $pos.node(0)
  return { node, from: 0, to: node.nodeSize, depth: 0 }
}

export function blockHandlePlugin(): Plugin {
  return new Plugin({
    key,
    state: {
      init: () => ({ hoverPos: null as number | null }),
      apply(tr, prev) {
        const meta = tr.getMeta(key)
        let hoverPos = prev.hoverPos
        if (meta && typeof meta.hoverPos === 'number') hoverPos = meta.hoverPos
        if (tr.docChanged && hoverPos != null) {
          const mapped = tr.mapping.map(hoverPos, -1)
          hoverPos = mapped
        }
        return { hoverPos }
      },
    },
    props: {
      decorations(state) {
        const { hoverPos } = (key.getState(state) as any) || {}
        if (hoverPos == null) return null
        const decos: Decoration[] = []
        try {
          const info = getBlockInfo((state as any).view as EditorView, hoverPos)
          const handle = document.createElement('button')
          handle.type = 'button'
          handle.textContent = '⋮⋮'
          handle.title = 'Block menu'
          handle.style.cssText = 'position: relative; left: -28px; margin-right: -24px; background: transparent; border: 1px solid #e5e7eb; color:#6b7280; border-radius:6px; width:24px; height:24px; cursor:grab;'
          handle.onmousedown = (e) => {
            e.preventDefault()
            const view = (state as any).view as EditorView
            const { from, to, node } = getBlockInfo(view, hoverPos)
            handle.style.cursor = 'grabbing'

            const onMouseUp = (ev: MouseEvent) => {
              document.removeEventListener('mouseup', onMouseUp)
              document.removeEventListener('mousemove', onMouseMove)
              handle.style.cursor = 'grab'
              const pos = view.posAtCoords({ left: ev.clientX, top: ev.clientY })?.pos
              if (typeof pos !== 'number') return
              const target = getBlockInfo(view, pos)
              // Prevent dropping inside itself
              if (target.from >= from && target.from <= to) return
              let insertPos = target.from
              // After deletion, positions shift if we are moving downwards
              if (insertPos > from) insertPos -= (to - from)
              const tr = view.state.tr
              tr.deleteRange(from, to)
              tr.insert(insertPos, node.copy(node.content))
              view.dispatch(tr.scrollIntoView())
            }
            const onMouseMove = (_ev: MouseEvent) => {
              // No-op for now; Dropcursor handles feedback
            }
            document.addEventListener('mouseup', onMouseUp)
            document.addEventListener('mousemove', onMouseMove)
          }
          const deco = Decoration.widget(info.from + 1, handle, { side: -1 })
          decos.push(deco)
        } catch {}
        return DecorationSet.create(state.doc, decos)
      },
      handleDOMEvents: {
        mousemove(view, event) {
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
          view.dispatch(view.state.tr.setMeta(key, { hoverPos: typeof pos === 'number' ? pos : null }))
          return false
        },
        mouseleave(view) {
          view.dispatch(view.state.tr.setMeta(key, { hoverPos: null }))
          return false
        },
      },
    },
    view(editorView) {
      ;(editorView.state as any).view = editorView
      return {
        destroy() {},
      }
    },
  })
}


