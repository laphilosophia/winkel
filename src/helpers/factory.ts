import Winkel from '../utils/core'

export default {
    // add a new step to the query
    Add: function (Pipetype: any, Args: any) {
        const step = [Pipetype, Args]

        // step is a pair of pipetype and its args
        this.program.push(step)

        return this
    },
    // a machine for query processing
    // our virtual machine for querying
    Run: function () {
        this.program = Winkel.Transform(this.program)

        // index of the last step in the program
        let max = this.program.length - 1

        // a gremlin, a signal string, or false
        let maybe_gremlin = false

        // results for this particular Run
        let results = []

        // behindwhich things have finished
        let done = -1

        // our program counter
        let pc = max


        let step: any[], state: any, pipetype: any

        while (done < max) {
            var ts = this.state
            // step is a pair of pipetype and args
            step = this.program[pc]
            // this step's state must be an object
            state = (ts[pc] = ts[pc] || {})
            // a pipetype is just a function
            pipetype = Winkel.GetPipetype(step[0])

            // 'pull' means the pipe wants more input
            // @ts-ignore
            if (maybe_gremlin === 'pull') {
                maybe_gremlin = false

                if (pc - 1 > done) {
                    // try the previous pipe
                    pc--
                    continue
                } else {
                    // previous pipe is done, so we are too
                    done = pc
                }
            }

            // 'done' tells us the pipe is finished
            // @ts-ignore
            if (maybe_gremlin === 'done') {
                maybe_gremlin = false
                done = pc
            }

            // move on to the next pipe
            pc++

            if (pc > max) {
                if (maybe_gremlin) {
                    // a gremlin popped out of the pipeline
                    results.push(maybe_gremlin)
                }

                maybe_gremlin = false

                // take a step back
                pc--
            }
        }

        // return projected results, or vertices
        results = results.map(
            gremlin => gremlin.result !== null ? gremlin.result : gremlin.vertex
        )

        return results
    }
}