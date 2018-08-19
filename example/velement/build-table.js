import { VElement } from '../../src/main'
import { initList, getListBySort, countTime } from '../common'
var tableDom = document.querySelector('table')
var vtbody = new VElement('tbody', {}, null)
tableDom.appendChild(vtbody.el)
var sortKey = document.querySelector('#sortKey')
var genBtn = document.querySelector('#genBtn')
var sortBtn = document.querySelector('#sortBtn')
var duration = document.querySelector('#duration')
var listCount = document.querySelector('#listCount')
var list = []
var sortedList = []

function init () {
    list = initList(listCount.value)
    countTime(duration, function(){
        vtbody.render({}, genTrs(list))
    })
}
function sortTable () {
    sortedList = getListBySort(list, Number(sortKey.value))
    countTime(duration, function(){
        console.log(34, list, sortedList)
        vtbody.render({}, genTrs(sortedList))
    })
}
function genTds(tds){
    var tdsDom = []

    tds.forEach(item => {
        tdsDom.push(new VElement('td', {}, [item]))
    })
    return tdsDom
}
function genTrs(trs) {
    var result =[]
    trs.forEach(item => {
        var tds = genTds(item)
        result.push(new VElement('tr', {}, tds))
    })
    return result
}
init()
genBtn.addEventListener('click', init)
sortBtn.addEventListener('click', sortTable)
