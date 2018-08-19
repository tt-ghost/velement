import { VElement } from '../../src/main'

const vspan = new VElement('span', {title: 'span title'}, null)
const vh3 = new VElement('h3', {id: 'my-ele'}, [vspan, 'text info'])
console.log('vh3:', vh3)