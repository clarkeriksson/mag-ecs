/**
 * Non-nullish primitive types used in mag-ecs components.
 */
export type ValuePrimitive = number | string | boolean;

/**
 * Array types of non-nullish primitives used in mag-ecs components.
 */
export type ValueArray = number[] | string[] | boolean[];

/**
 * All primitive or array-primitive mag-ecs data types.
 */
export type Value = ValuePrimitive | ValueArray;

/**
 * Transforms union types into a union type of each union member's array-type.
 * For example, 'string | number | Date' goes to 'string[] | number[] | Date[]'.
 */
export type UnionToArray<T> = T extends any ? T[] : never;

/**
 * Primitive class instance types used in mag-ecs components.
 */
export type PrimitiveClass = String | Number | Boolean;

/**
 * Primitive constructor types used in mag-ecs components.
 */
export type PrimitiveCtor = StringConstructor | NumberConstructor | BooleanConstructor;

export type PrimitiveFromClassType<I extends PrimitiveClass> =
    I extends String ? string :
    I extends Number ? number :
    boolean;

export type PrimitiveFromCtorType<C extends PrimitiveCtor> =
    C extends StringConstructor ? string :
    C extends NumberConstructor ? number :
    boolean;

export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue; }
export interface JSONArray extends Array<JSONValue> {}

export type JSONRepresentation<I extends Serializable> =
    I extends Serializable<infer J> ? J : never;

export interface Serializable<J extends JSONValue = JSONValue> {
    toJSON(): J;
}

export interface SerializableCtor<I extends Serializable = Serializable> {
    new(...args: any[]): I;
    fromJSON(json: JSONRepresentation<I>): I;
}

export type ValidMagCtor = PrimitiveCtor | SerializableCtor;

export type ValidMagClass = PrimitiveClass | Serializable;

export type CtorData<T extends ValidMagCtor> =
    T extends PrimitiveCtor ? PrimitiveFromCtorType<T> :
    T extends SerializableCtor<infer I> ? I : never;

export type CtorReadData<T extends ValidMagCtor, R extends boolean> =
    R extends true ? DeepReadonly<CtorData<T>> : CtorData<T>;

export type CtorMutArgData<T extends ValidMagCtor, R extends boolean> =
    R extends true ? never : CtorData<T>;


/**
 * Converts a type T into a readonly version of itself, recursively.
 */
export type DeepReadonly<T> =
    T extends Array<infer U> // arrays become readonly arrays
        ? ReadonlyArray<DeepReadonly<U>>
        : T extends Function
            ? T
        : T extends object // nested objects recurse
            ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
            : T; // primitives stay the same