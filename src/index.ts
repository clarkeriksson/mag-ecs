export { Accessor, component } from './core/component.js';
export { World } from './core/world.js';
export { Bark as MagEvent } from './core/bark.js';
export { Query } from './core/query.js';
export { Bitset } from './util/bitset.js';
export { SparseSet } from './util/sparse-set.js';
export { SparseBitSet } from './util/sparse-bit-set.js';
export { SparseTagSet } from './util/sparse-tag-set.js';
export { TimeContext } from './util/time-context.js';

export type {
    Value,
    UnionToArray,
    MagValueCtor as PrimitiveCtor,
    DataFromMagCtor as PrimitiveFromCtorType,
    JSONValue,
    JSONObject,
    JSONArray,
    JSON as JSONRepresentation,
    Serializable,
    MagDataClassCtor as SerializableCtor,
    CtorData,
    CtorReadData,
    CtorMutArgData,
    DeepReadonly,
    MagTypes,
} from "./globals";

export type {
    Component
} from './core/component.js';