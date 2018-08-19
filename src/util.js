import VElement from './element'
import { DEFAULT_TAG, DEFAULT_RPOPS, DEFAULT_CHILDREN } from './constants'


export const dom = {
  setAttribute: (el, props) => {
    for(let name in props){
      el.setAttribute(name, props[name])
    }
  },

  appendChildren: (el, children) => {
    children.forEach(item => {
      let child = dom.getDomElement(item)
      el.appendChild(child)
    })
  },

  createElement: (tag = DEFAULT_TAG, props = DEFAULT_RPOPS(), children = DEFAULT_CHILDREN()) => {
    const el = document.createElement(tag)
    dom.setAttribute(el, props)
    dom.appendChildren(el, children)
    return el
  },

  getDomElement: (el) => {
    return dom.isVelement(el) ? el.render() : document.createTextNode(JSON.stringify(el))
  },

  isVelement: (node) => {
    return node instanceof VElement
  }
}

export default {
  dom
}
