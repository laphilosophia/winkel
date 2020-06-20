import Winkel from './core'

export default {
    Graph: function (Vertices: any, Edge: any) {
        const graph = Object.create(Winkel.Prototype)

        // fresh copies so they're not shared
        graph.edges = []
        graph.vertices = []
        // a lookup optimization
        graph.vertexIndex = {}

        // an auto-incrementing ID counter
        graph.autoid = 1

        // arrays only, because you wouldn't
        if (Array.isArray(Vertices)) {
            graph.AddVertices(Vertices)
        }

        // call this with singular V and E
        if (Array.isArray(Edge)) {
            graph.AddEdges(Edge)
        }

        return graph
    },
    Query: function (Graph: any) {
        const query = Object.create(Winkel.Factory)

        // the graph itself
        query.graph = Graph
        // state for each step
        query.state = []
        // list of steps to take
        query.program = []
        // gremlins for each step
        query.gremlins = []

        return query
    },
    // adds a chainable method
    AddPipetype: function (Name: string, Func: Function) {
        Winkel.Pipetypes[Name] = Func

        // capture pipetype and args
        Winkel.Factory[Name] = function () {
            return this.Add(
                Name,
                [].slice.apply(arguments)
            )
        }
    },
    GetPipetype: function (Name: string) {
        // a pipetype is a function
        const pipetype = Winkel.Pipetypes[Name]

        if (!pipetype) {
            Winkel.Error(`Unrecognized pipetype: ${Name}`)
        }

        return pipetype || Winkel.FauxPipetype
    },
    AddTransformer: function (Fun: Function, Priority: number) {
        if (typeof Fun !== 'function') {
            return Winkel.Error('Invalid transformer function')
        }

        // OPT: binary search
        for (let i = 0; i < Winkel.Transformers.length; i++) {
            if (Priority > Winkel.Transformers[i].priority)
                break

            Winkel.Transformers.splice(i, 0, {
                priority: Priority,
                fun: Fun
            })
        }
    },
    FilterEdges: function (Filter: string | any[]) {
        return function (Edge: { _label: string }) {
            // no Filter: everything is valid
            if (!Filter) return true

            // string Filter: label must match
            if (typeof Filter == 'string') {
                return Edge._label == Filter
            }

            // array Filter: must contain label
            if (Array.isArray(Filter)) {
                return !!~Filter.indexOf(Edge._label)
            }

            // object Filter: check Edge keys
            return Winkel.ObjectFilter(Edge, Filter)
        }
    },
    Transform: function (Program: any) {
        return Winkel.Transformers.reduce(
            (acc, transformer) => transformer.fun(acc),
            Program
        )
    },
    SimpleTraversal: function (Dir: string) {
        const find_method = Dir === 'out' ? 'FindOutEdges' : 'FindInEdges'
        const edge_list = Dir === 'out' ? '_in' : '_out'

        return function (
            graph: {
                [x: string]: (arg0: any) => any[]
            },
            args: any[],
            gremlin: {
                vertex: any
            },
            state: {
                edges: {
                    (): any;
                    new(): any;
                    [x: string]: any
                }[];
                gremlin: any
            }
        ) {
            // query initialization
            if (!gremlin && (!state.edges || !state.edges.length)) {
                return 'pull'
            }

            // state initialization
            if (!state.edges || !state.edges.length) {
                state.gremlin = gremlin
                // get matching edges
                state.edges = graph[find_method](gremlin.vertex)
                    .filter(
                        Winkel.FilterEdges(args[0])
                    )
            }

            // nothing more to do
            if (!state.edges.length) {
                return 'pull'
            }

            // use up an edge
            const vertex = state.edges.pop()[edge_list]

            return Winkel.GotoVertex(state.gremlin, vertex)
        }
    },
    ObjectFilter: function (
        Thing: { [x: string]: any },
        Filter: { [x: string]: any }
    ) {
        for (var key in Filter) {
            if (Thing[key] !== Filter[key]) {
                return false
            }
        }

        return true
    },
    MakeGremlin: function (Vertex: any, State: any) {
        return {
            vertex: Vertex,
            state: State || {}
        }
    },
    // clone the Gremlin
    GotoVertex: function (Gremlin: { state: any }, Vertex: any) {
        return Winkel.MakeGremlin(Vertex, Gremlin.state)
    },
    AddAlias: function (
        Newname: any,
        Oldname: any,
        Defaults?: any[]
    ) {
        // default arguments for the alias
        Defaults = Defaults || []

        Winkel.AddTransformer(function (Program: any[]) {
            return Program.map(function (Step: any[]) {
                if (Step[0] !== Newname) {
                    return Step
                }

                return [
                    Oldname,
                    Winkel.Extend(
                        Step[1],
                        Defaults
                    )
                ]
            })
        }, 100) // 100 because aliases run early

        Winkel.AddPipetype(Newname, function () { })
    },
    Extend: function (
        List: { [x: string]: any },
        Defaults: { [x: string]: any }
    ) {
        return Object.keys(Defaults).reduce(function (acc, key) {
            if (typeof List[key] !== 'undefined') {
                return acc
            }

            acc[key] = Defaults[key]

            return acc
        }, List)
    },
    Jsonify: function (Graph: { vertices: any; edges: any }) {
        return `{"V": ${JSON.stringify(Graph.vertices, Winkel.CleanVertex)}, "E": ${JSON.stringify(Graph.edges, Winkel.CleanEdge)}}`
    },
    // another graph constructor
    FromString: function (str: string) {
        // this can throw
        const obj = JSON.parse(str)

        return Winkel.Graph(obj.V, obj.E)
    },
    CleanVertex: function (Key: string, Value: any) {
        return (Key == '_in' || Key == '_out') ? undefined : Value
    },
    CleanEdge: function (Key: string, Value: { _id: any }) {
        return (Key == '_in' || Key == '_out') ? Value._id : Value
    },
    Persist: function (Graph: string, Name: string) {
        Name = Name || 'Graph'

        localStorage.setItem(`DAGOBA::${Name}`, Graph)
    },
    Depersist: function (Name: string) {
        Name = `DAGOBA::${Name || 'graph'}`

        const flatgraph = localStorage.getItem(Name)

        return Winkel.FromString(flatgraph)
    },
    // pass the result upstream
    FauxPipetype: function (x: any, y: any, Maybe_Gremlin: any) {
        // or send a pull downstream
        return Maybe_Gremlin || 'pull'
    },
    Error: function (Msg: string | number | boolean | any) {
        console.error(Msg)
        return false
    },
}