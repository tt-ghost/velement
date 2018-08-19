import types, { MOVE_TYPES } from './types'
import VElement from './element'
import { dom } from './util'
const { isVelement } = dom


function diff(oldTree, newTree) {
    let patches = []
    let index = 0
    diffNode(oldTree, newTree, index, patches)
    return patches
}

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
            // 比较子节点
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

function diffProps(propsA, propsB) {
    const propsPatch = {}
    const _propsA = propsA || {}
    const _propsB = propsB || {}

    // 遍历旧属性，分别比较每个旧属性与新属性是否相同，这里简单起见，没有深层递归比较，如果属性值是引用类型，只要引用地址不同就认为不同
    for (let key in _propsA) {
        if (_propsB[key] !== _propsA[key]) {
            propsPatch[key] = _propsB[key]
        }
    }

    // 遍历新对象，用于记录增加的属性
    for (let key in _propsB) {
        if (!(key in _propsA)) {
            propsPatch[key] = _propsB[key]
        }
    }

    return propsPatch
}

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

function getChildNodeCount (node) {
    let result = 0
    function getChildrenLength (node) {
        (node.children || []).forEach(item => {
            result++
            getChildrenLength(item)
        })
    }
    getChildrenLength(node)
    return result
}

function listDiff (oldList, newList) {
    let oldListTmp = Object.assign([], oldList)
    let newListTmp = Object.assign([], newList)
    let listPatches = []
    let willRemoveKey = 0
    oldListTmp.forEach((old, k) => {
        if (newListTmp.indexOf(old) === -1) {
            listPatches.push({type: MOVE_TYPES.REMOVE, index: k - willRemoveKey})
            willRemoveKey++
        }
    })

    listPatches.forEach(diff => {
        oldListTmp.splice(diff.index, 1)
    })

    newListTmp.forEach((item, k) => {
        if (oldListTmp.indexOf(item) === -1) {
            listPatches.push({type: MOVE_TYPES.INSERT, index: k, item})
        }
    })

    return listPatches
}


export default diff
