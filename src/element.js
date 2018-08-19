import util from './util'
import diff from './diff'
import patch from './patch'
import { DEFAULT_TAG, DEFAULT_RPOPS, DEFAULT_CHILDREN } from './constants'

class VElement {
  constructor(tag, props, children) {
    this.tag = tag || DEFAULT_TAG
    this.props = props || DEFAULT_RPOPS()
    this.children = children || DEFAULT_CHILDREN()
    // TODO: 优化使用
    this.key = this.props.key
    // 真实dom元素，可直接渲染到文档中
    this.el = null
    // 实例化后创建真实dom节点，是否挂载到文档根据业务需求
    this.render()
  }
  render (props, children) {
    let newElement = null
    // 有传参时，主动创建一个虚拟节点
    if (props || children) {
      newElement = new VElement(this.tag, props, children)
      // 如果存在，比较差异并应用到之前节点上，不存在的设置this.el为创建的新dom节点
      if (this.el) {
        const elPatch = diff(this, newElement)
        patch(this, elPatch)
      } else {
        this.el = newElement.render()
      }
    } else {
      // 创建真实dom节点
      if (!this.el) {
        this.el = util.dom.createElement(this.tag, this.props, this.children)
      }
    }
    return this.el
  }
}

export default VElement
