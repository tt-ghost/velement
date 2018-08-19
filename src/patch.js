import TYPES, { MOVE_TYPES } from './types'
import { dom } from './util'
const { isVelement, getDomElement } = dom

let index = 0

function patch(velement, patches) {
    // velement 为原始虚拟节点，这里walk与 diff.js里的diffNode是反操作
    walk(velement, index, patches)
}

function walk (velement, index, patches) {
    const currentPatches = patches[index]
    if (currentPatches) {
        applyPatches(velement, currentPatches)
    }
    (velement.children || []).forEach(child => {
        index++
        walk(child, index, patches)
    })
}

function applyPatches(velement, currentPatches) {
  let el = velement.el
  currentPatches.forEach(patch => {
    switch (patch.type) {
      case TYPES.VPROPS:
      setProps(el, patch.item)
      break
      case TYPES.VTEXT:
      setText(el, patch.item)
      break
      case TYPES.VREPLACE:
      replaceDom(el, patch.item)
      break
      case TYPES.VMOVE:
      moveDom(velement, patch.moves)
      break
      default:
      break
    }
  })
}

function setProps (dom, props) {
    const _props = props || {}
    for(let k in _props) {
        dom.setAttribute(k, _props[k])
    }
}

function setText (dom, text) {
    dom.innerText = text
}

function replaceDom (mountedDom, newDom) {
    // mountedDom 为已经渲染的dom，vdom为vitual dom
    const tmpDom = isVelement(newDom) ? newDom.render() : newDom
    mountedDom.parentNode.replaceChild(tmpDom, mountedDom)
}

function moveDom (velement, moves) {
    // TODO:这里可以通过 velement 的key 属性优化
    const el = velement.el

    moves.forEach(move => {
        // 这里操作真实dom的同时，需要同步更新虚拟节点
        const { index, type, item } = move
        if (type === MOVE_TYPES.REMOVE) {
            el.removeChild(el.childNodes[index])
            velement.children.splice(index, 1)
        } else if (type === MOVE_TYPES.INSERT) {
            el.insertBefore(getDomElement(item), el.childNodes[index])
            velement.children.splice(index, 0, item)
        }
    })
}

export default patch