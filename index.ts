/**
 * @version 0.0.1
 * @author Erdem Arslan (TS) - Dann Toliver (JS)
 * @description In-Memory Graph Database - Typescript version
 * @license WTFPL - http://www.wtfpl.net/about/
 * @documents http://aosabook.org/en/500L/dagoba-an-in-memory-graph-database.html
 */


// the namespace
import Winkel from './src/utils/core'

Winkel.AddAlias('parents', 'out', ['parent'])

Winkel.AddAlias('children', 'in', ['parent'])

Winkel.AddAlias('grandparents', [
    ['out', 'parent'],
    ['out', 'parent']
])

Winkel.AddAlias('siblings', [
    ['as', 'me'],
    ['out', 'parent'],
    ['in', 'parent'],
    ['except', 'me']
])

Winkel.AddAlias('cousins', [
    'parents',
    ['as', 'folks'],
    'parents',
    'children',
    ['except', 'folks'],
    'children',
    'unique'
])

export default Winkel