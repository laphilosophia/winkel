import Winkel from '../utils/core'

export default {
    AddVertices: function (VS: any[]) {
        VS.forEach(this.AddVertex.bind(this))
    },
    AddEdges: function (ES: any[]) {
        ES.forEach(this.AddEdge.bind(this))
    },
    // accepts a vertex-like object
    AddVertex: function (Vertex: {
        _id: string | number,
        _in: any[],
        _out: any[]
    }) {
        if (!Vertex._id) {
            Vertex._id = this.autoid++
        } else if (this.findVertexById(Vertex._id)) {
            return Winkel.Error('A vertex with that ID already exists')
        }

        this.vertices.push(Vertex)

        // a fancy index thing
        this.vertexIndex[Vertex._id] = Vertex

        // placeholders for edge pointers
        Vertex._out = []
        Vertex._in = []

        return Vertex._id
    },
    // accepts an edge-like object
    AddEdge: function (Edge: {
        _id: string | number,
        _in: {
            _out: any[],
            _in: any[]
        },
        _out: {
            _out: any[],
            _in: any[]
        }
    }) {
        Edge._in = this.findVertexById(Edge._in)
        Edge._out = this.findVertexById(Edge._out)

        if (!(Edge._in && Edge._out)) {
            return Winkel.Error(`That edge's ${Edge._in ? 'out' : 'in'} vertex was not fount`)
        }

        // edge's out vertex's out edges
        Edge._out._out.push(Edge)

        // vice versa
        Edge._in._in.push(Edge)

        this.edges.push(Edge)
    },
    // vertex finder helper
    FindVertices: function (Args: string | any[]) {
        if (typeof Args[0] === 'object') {
            return this.searchVertices(Args[0])
        } else if (Args.length === 0) {
            // OPT: slice is costly
            return this.vertices.slice()
        } else {
            return this.findVerticesByIds(Args)
        }
    },
    FindVerticesByIds: function (Ids: any[]) {
        if (Ids.length === 1) {
            // maybe it's a vertex
            const Maybe_Vertex = this.FindVertexById(Ids[0])

            // or maybe it isn't
            return Maybe_Vertex ? [Maybe_Vertex] : []
        }

        return Ids.map(
            this.FindVertexById.bind(this)
        ).filter(Boolean)
    },
    FindVertexById: function (Vertex_id: string | number) {
        return this.vertexIndex[Vertex_id]
    },
    // match on filter's properties
    SearchVertices: function (Filter: any) {
        return this.vertices.filter(
            (Vertex: any) => Winkel.ObjectFilter(Vertex, Filter)
        )
    },
    FindInEdges: function (Vertex: { _in: any }) {
        return Vertex._in
    },
    FindOutEdges: function (Vertex: { _out: any }) {
        return Vertex._out
    },
    // query initializer: Prototype.Build() -> query
    Build: function () {
        const query = Winkel.Query(this)

        // add a step to our program
        query.Add(
            'vertex',
            [].slice.call(arguments)
        )

        return query
    },
    ToString: function () {
        return Winkel.Jsonify(this)
    }
}