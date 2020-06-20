import Winkel from '../utils/core'

export default {
    Vertex: function (
        graph: {
            findVertices: (arg0: any) => any
        },
        args: any,
        gremlin: {
            state: any
        },
        state: {
            vertices: any[]
        }
    ) {
        if (!state.vertices) {
            // state initialization
            state.vertices = graph.findVertices(args)
        }
    
        // all done
        if (!state.vertices.length) {
            return 'done'
        }
    
        // OPT: requires vertex cloning
        const vertex = state.vertices.pop()
    
        // gremlins from as/back queries
        return Winkel.MakeGremlin(vertex, gremlin.state)
    },
    Out: Winkel.SimpleTraversal('out'),
    In: Winkel.SimpleTraversal('in'),
    Property: function (
        graph: any,
        args: (string | number)[],
        gremlin: {
            result: any;
            vertex: {
                [x: string]: any
            }
        },
        state: any
    ) {
        // query initialization
        if (!gremlin) return 'pull'
    
        gremlin.result = gremlin.vertex[args[0]]
    
        // false for bad props
        return gremlin.result === null ? false : gremlin
    },
    Unique: function (
        graph: any,
        args: any,
        gremlin: {
            vertex: { _id: string | number }
        },
        state: { [x: string]: boolean }
    ) {
        // query initialization
        if (!gremlin) return 'pull'
    
        // reject repeats
        if (state[gremlin.vertex._id]) return 'pull'
    
        state[gremlin.vertex._id] = true
    
        return gremlin
    },
    Filter: function (
        graph: any,
        args: (
            (arg0: any, arg1: any) => any
        )[],
        gremlin: { vertex: any },
        state: any
    ) {
        // query initialization
        if (!gremlin) return 'pull'
    
        // filter by object
        if (typeof args[0] == 'object') {
            return Winkel.ObjectFilter(
                gremlin.vertex,
                args[0]
            ) ? gremlin : 'pull'
        }
    
        if (typeof args[0] !== 'function') {
            Winkel.Error(`Filter is not a function: ${args[0]}`)
    
            // keep things moving
            return gremlin
        }
    
        // gremlin fails filter
        if (!args[0](gremlin.vertex, gremlin)) return 'pull'
    
        return gremlin
    },
    Take: function (
        graph: any,
        args: any[],
        gremlin: any,
        state: { taken: number }
    ) {
        // state initialization
        state.taken = state.taken || 0
    
        if (state.taken === args[0]) {
            state.taken = 0
    
            // all done
            return 'done'
        }
    
        // query initialization
        if (!gremlin) return 'pull'
    
        state.taken++
    
        return gremlin
    },
    As: function (
        graph: any,
        args: (string | number)[],
        gremlin: {
            state: {
                as: {
                    [x: string]: any
                }
            };
            vertex: any
        },
        state: any
    ) {
        // query initialization
        if (!gremlin) return 'pull'
    
        // init the 'as' state
        gremlin.state.as = gremlin.state.as || {}
    
        // set label to vertex
        gremlin.state.as[args[0]] = gremlin.vertex
    
        return gremlin
    },
    Merge: function (
        graph: any,
        args: any[],
        gremlin: {
            state: any
        },
        state: {
            vertices: any[]
        }
    ) {
        // query initialization
        if (!state.vertices && !gremlin) return 'pull'
    
        // state initialization
        if (!state.vertices || !state.vertices.length) {
            const obj = (
                gremlin.state || {}
            ).as || {}
    
            state.vertices = args
                .map((id: string | number) => obj[id])
                .filter(Boolean)
        }
    
        // done with this batch
        if (!state.vertices.length) return 'pull'
    
        const vertex = state.vertices.pop()
    
        return Winkel.MakeGremlin(
            vertex,
            gremlin.state
        )
    },
    Except: function (
        graph: any,
        args: (string | number)[],
        gremlin: {
            vertex: any;
            state: {
                as: {
                    [x: string]: any
                }
            }
        },
        state: any
    ) {
        // query initialization
        if (!gremlin) return 'pull'
    
        if (
            gremlin.vertex === gremlin.state.as[args[0]]
        ) return 'pull'
    
        return gremlin
    },
    Back: function (
        graph: any,
        args: (string | number)[],
        gremlin: {
            state: {
                as: {
                    [x: string]: any
                }
            }
        },
        state: any
    ) {
        // query initialization
        if (!gremlin) return 'pull'
    
        return Winkel.GotoVertex(
            gremlin,
            gremlin.state.as[args[0]]
        )
    },
}