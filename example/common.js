export function initList (count) {
    var listCount = count || '30'
    var count = parseInt(listCount)
    var result = []
    var fieldsLen = 18
    for (var i = 0; i < count; i++) {
        var tmp = []
        for (var j = 0; j < fieldsLen; j++) {
            tmp.push(getNum())
        }
        result.push(tmp)
    }
    return result
}

export function getListBySort (list, sortKey) {
    return list.sort((a, b) => {
        console.log( a[sortKey] - b[sortKey] >= 0)
        return a[sortKey] - b[sortKey]
    })
}

export function countTime (durationDom, job) {
    var startTime = new Date().valueOf()
    job()
    durationDom.innerText =  new Date().valueOf() - startTime
}

function getNum () {
    return parseInt(Math.random() * 100)
}