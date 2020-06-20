import Methods from './methods'
import {
    Prototypes,
    Factory,
    Pipetypes
} from '../helpers'

// the namespace
export default {
    // the prototype
    Prototype: Prototypes,
    // the factory
    Factory: Factory,
    // the pipetypes
    Pipetypes: Pipetypes,
    // the transformers (more than meets the eye)
    Transformers: [],
    ...Methods
}