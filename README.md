
# Vitual DOM简易实现


> 本文希望用一个简单的示例讲述 `Vitual DOM` 的实现，借鉴了第三方开源及一些自己的理解，希望看完后对其有更好的理解


## 一、前言

### 为什么需要`Vitual DOM`?

在传统前端开发中，经常需要操作DOM来满足交互需求，比如表格排序、过滤等操作时，数据量较小时，往往看不出性能问题，随着数据增多及过滤条件变化，每次重新生成完整DOM变得不是太可取，此时就需要考虑如何减少DOM操作、怎样避免重建DOM等问题，随着React等发展，提出了`Vitual DOM`的概念



### 传统实现思路：

实现以上功能方式有很多种，最常见方式就根据根据数据及需要排序的字段，生成标签字符串，然后找到`table`节点，修改`tbody`的`innerHTML`属性。

```javascript
// 用 `list` 表示表格数据， sortKey表示排序字段，下面是一个实现伪代码
var list = [{}, {}, {}, ...]
var sortKey = 'age'
var tbody = document.querySelector('tbody')
// 排序数组
var list.sort((a, b) => a[sortKey] - b[sortKey])
// 将数据转换为标签字符串
function renderToString(list) {
    return list.map(item => `<tr><td>${item.age}</td>...</tr>`).join('')
}
// 将最终标签字符串转换为真实DOM节点
tbody.innerHTML = renderToString(list)
```

优缺点想必大家都清楚，在此在简单说明下：
- 优点1：可快速将数据渲染到页面，对于简单数据展示是个不错的选择
- 缺点1：`list`的其中一项数据变动需要渲染整个表格。当数据量变大及交互复杂大时，渲染计算将非常消耗资源
- 缺点2：表格内的交互状态很难维持，比如表格内有个聚焦的输入框
- 缺点3：维护成本高。尤其是业务复杂时，需要写很多的 `renderToString` 方法放到dom的 `innerHTML` 上
- ...

**综上，我们希望能有一个易维护、使用成本低、性能更高、且能保持交互状态等的方式。这就需要提到前端比较火的实现方式：`Vitual DOM`。接下来就看下如何实现这样一个 `Vitual DOM`。**


## 二、实现`Vitual DOM`的关键步骤

- **第一步：用js对象描述DOM树结构，然后用这个树构建真实DOM，并渲染到文档中**
- **第二步：状态变更时，用变更后的树之前树比较，记录差异及更新步骤**
- **第三步：将第二步记录的差异应用到第一步的真实DOM树上，从而更新视图**

针对每一步骤，具体分析如何实现

### 第一步：用js对象描述DOM树结构，然后用这个树构建真实DOM，并渲染到文档中

通过分析DOM节点，不难发现知道节点名称、属性及子节点就能描述一个DOM节点，于是可以实现一个`element.js`模块用于创建一个`Vitual DOM`

```javascript
// element.js
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
```

我们验证下用法，请看 `example/velement/example01.js` 文件

```javascript
// example/velement/example01.js
import VElement from './element.js'

const vspan = new VElement('span', {title: 'span title'}, null)
const vh3 = new VElement('h3', {id: 'my-ele'}, [vspan, 'text info'])
console.log(vh3)
```

如果希望插入到DOM文档中，可以这么操作

```javascript
document.body.appendChild(vh3.el)
```


### 第二步：状态变更时，用变更后的树之前树比较，记录差异及更新步骤

- 怎么比较呢？对于一个树来说，通常只需要进行同级比较就可以了，然后进行相应的 **CRUD** 操作
- 确认查找顺序，为了每个节点都遍历到，可以从 **跟节点** 开始向下遍历子节点，如果其中一个子节点又有子孙节点，暂停同级其他子节点，而是遍历子孙节点，直到此子节点所有子孙节点全部遍历完毕，再遍历同级其他子节点。顺序如下数字所示：

```html
            div(0)
      ↙￣￣￣￣￣￣￣￣↘
    div(1)            h2(5)
  ↙￣￣￣￣↘       ↙￣￣￣￣↘
span(2)  span(4)  b(6)   span(7)
  ↓ 
 em(3)
```


这一步的本质是比较两个`Vitual DOM`，同级节点对比后发现差异记录到`patches`中，最后将`patches`返回，下面实现下`diff.js`模块，主要包括4个主要方法：
- `diff`：作为入口，入参为两颗树，返回两个树的差异集合 `patches`
- `diffNode`：比较两棵树单一节点，从跟节点开始，涉及到子节点时，会递归调用。不进行子孙节点比较，并记录到`patches`中。这里的`index`为`oldTree`的节点遍历索引，从`0`开始，顺序如上所述。`index`的作用是在最后将`patches`应用在真实dom节点时用
- `diffChildren`：比较两个树的子孙节点，并只做同级节点比较
- `diffProps`：比较两个节点的属性，也将差异存储到 `patches` 中

#### 1、`diff` 文件示例
```javascript

function diff(oldTree, newTree) {
    let patches = []
    let index = 0
    diffNode(oldTree, newTree, index, patches)
    return patches
}
// ...
```


#### 2、`diffNode` 比较单一节点

```javascript
function diffNode(oldTree, newTree, index, patches) {
    const currentPatches = []
    // 什么也不做
    if (newTree === null) {
    // 同类型才进行比较
    } else if (typeof oldTree === 'string' && typeof newTree === 'string') {
        if (oldTree !== newTree) {
            currentPatches.push({type: types.VTEXT, item: newTree})
        }
    } else if (isVelement(newTree) && isVelement(oldTree)) {
        // 优先比较标签，标签不同就执行替换操作
        if (newTree.tag === oldTree.tag) {
            // 比较属性差异
            const propsPatch = diffProps(oldTree.props, newTree.props)
            if (Object.keys(propsPatch).length) {
              currentPatches.push({ type: types.VPROPS, item: propsPatch })
            }
            // 比较直节点
            diffChildren(oldTree.children, newTree.children, index, patches, currentPatches)
        } else {
            currentPatches.push({ type: types.VREPLACE, item: newTree })
        }
    // 非同类型都进行替换
    } else {
        currentPatches.push({ type: types.VREPLACE, item: newTree })
    }
    patches[index] = currentPatches
    return patches
}
```


#### 3、`diffChildren` 比较同级子节点

```javascript
function diffChildren(oldChildren, newChildren, index, patches, currentPatches) {
    // 同级子节点比较
    let listPatches = listDiff(oldChildren, newChildren)
    if (listPatches.length) {
        currentPatches.push({type: types.VMOVE, moves: listPatches})
    }

    // 子孙节点比较
    let currentIndex = index
    oldChildren.forEach((child, k) => {
        const newChild = newChildren[k]
        currentIndex = currentIndex + getChildNodeCount(child) + 1
        // 递归比较单一节点
        diffNode(child, newChild, currentIndex, patches)
    })
}

// 深度递归子孙节点，统计节点数
function getChildNodeCount (node) {
    // return count
}

// 列表diff
function listDiff (oldList, newList) {
    // ...
}
```


#### 4、`diffProps` 比较属性的差异

```javascript
function diffProps(propsA, propsB) {
    const diffs = {}
    const _propsA = propsA || {}
    const _propsB = propsB || {}

    // 遍历旧属性，分别比较每个旧属性与新属性是否相同，这里简单起见，没有深层递归比较，如果属性值是引用类型，只要引用地址不同就认为不同
    for (let key in _propsA) {
        if (_propsB[key] !== _propsA[key]) {
            diffs[key] = _propsB[key]
        }
    }

    // 遍历新对象，用于记录增加的属性
    for (let key in _propsB) {
        if (!(key in _propsA)) {
            diffs[key] = _propsB[key]
        }
    }

    return diffs
}
```


从上面代码我们可以看到 `patches` 是`diff`最终返回的值，我们可以假想下，`patches`应该是什么样才能更好的描述并方便应用在原始虚拟节点上，并能反映待改动的地方，由于每个节点都可能有多步修改操作，所以 `patches`数据结构应为二维数组或 `{0: [{...}, {...}, ...]}`形式，每个 `patche`大概长这样：

```javascript
// 此为同级节点比较
[{
    type: 'INSERT', // 操作类型
    index: 1,       // 原始节点的位置
    item: item      // 可选项，是需要改动的内容，可以属性、虚拟节点、字符串等
    
}]
```
那么`patches`应该长什么样呢？我们来分析下：


- 首先，为了更好的将比较的差异应用在原始节点上，就需要知道每个原始节点的`index`，方便找到对应节点
- 其次，在`diff`的时候，插入、删除、更新三种主要变更方式，还有节点属性、字符串、虚拟节点、子节点等变更对象类型，所以需要记录变更方式及变更的对象类型，比较后可以发现：

    - 属性修改、删除、更新其实是一个普通js对象比较的过程，表的差异同样也可以是一个js对象，最后将这个对象遍历应用的原属性即可，这里属性的变更类型定义为 `VPROPS`
    - 字符串同属性操作基本一样，不过不用遍历，新旧字符串不同直接替换即可，这里字符串的变更类型定义为 `VTEXT`
    - 对于虚拟节点，非子节点比较的时，可以统一用替换的方式（`VREPLACE`）。节点的更新，有这么几种，标签名（`tag`）、属性（`props`）、子节点（`children`），其中标签名不同可认为新节点，属性的更新前面说了，子节点更新看下一条，所以单一节点更新操作用一个变更类型即可
    - 子节点（children）操作有这么几种：新建、删除、移动。其中新建、删除前面说过，对于移动多个子节点时，理论上用替换操作（`VREPLACE`）也是可以做到的。但是如果只是最后一个节点与第一个节点互换位置，最后一个节点与第一个节点内部结构暂且不用关心，中间节点没有任何移动，通过替换的方式需要新建最后一个及第一个节点，如果这两个节点没有子节点还好，如果分别都有自己的子孙节点，需要递归生成节点，性能不够友好。因此这里添加一个新的操作类型，移动`VMOVE`

综上，我们可以定义`patche` 类型有以下几种：

```javascript
// types.js
export default {
    VPROPS: 'VPROPS',
    VTEXT: 'VTEXT',
    VREPLACE: 'VREPLACE',
    VMOVE: 'VMOVE'
}
// VMOVE TYPES
export const MOVE_TYPES = {
    REMOVE: 'REMOVE',
    INSERT: 'INSERT'
}
```

具体代码可以参考`diff.js`


### 第三步：将第二步记录的差异应用到第一步的真实DOM树上，从而更新视图

我们需要实现一个`patch.js`的模块，根据不同变更类型将不同的`patch`应用到真实dom节点上，整体大概是这样：

```javascript
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

```


## 三、总结

为此，整个`Vitual DOM`原理基本完毕，这里只是简单示例，还有些优化方面这里并没有太多涉及，如key、list diff优化等。总结下有三步：

- 用js对象描述一个dom树结构，提供`render`方法，生成真实dom节点并插入到文档中
- 渲染的时候比较变化前后树结构差异，并缓存起来
- 将缓存的差异应用到已经渲染的真实dom节点上，更新视图



## 四、引用

- [virtual-dom](https://github.com/Matt-Esch/virtual-dom)
- [vue vdom](https://github.com/vuejs/vue/blob/dev/src/core/vdom)
- [preact vdom](https://github.com/developit/preact/tree/master/src/vdom)

