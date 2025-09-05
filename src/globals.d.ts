/**
 * Non-nullish primitive types used in mag-ecs components.
 */
declare type ValuePrimitive = number | string | boolean;

/**
 * Array types of non-nullish primitives used in mag-ecs components.
 */
declare type ValueArray = number[] | string[] | boolean[];

/**
 * All primitive or array-primitive mag-ecs data types.
 */
declare type Value = ValuePrimitive | ValueArray;

/**
 * Transforms union types into a union type of each union member's array-type.
 * For example, 'string | number | Date' goes to 'string[] | number[] | Date[]'.
 */
declare type UnionToArray<T> = T extends any ? T[] : never;

/**
 * Primitive class instance types used in mag-ecs components.
 */
declare type PrimitiveClass = String | Number | Boolean;

/**
 * Primitive constructor types used in mag-ecs components.
 */
declare type PrimitiveCtor = StringConstructor | NumberConstructor | BooleanConstructor;

declare type PrimitiveFromClassType<I extends PrimitiveClass> =
    I extends String ? string :
    I extends Number ? number :
    boolean;

declare type PrimitiveFromCtorType<C extends PrimitiveCtor> =
    C extends StringConstructor ? string :
    C extends NumberConstructor ? number :
    boolean;

declare type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
declare interface JSONObject { [key: string]: JSONValue; }
declare interface JSONArray extends Array<JSONValue> {}

declare type JSONRepresentation<I extends Serializable> =
    I extends Serializable<infer J> ? J : never;

declare interface Serializable<J extends JSONValue = JSONValue> {
    toJSON(): J;
}

declare interface SerializableCtor<I extends Serializable = Serializable> {
    new(...args: any[]): I;
    fromJSON(json: JSONRepresentation<I>): I;
}

declare type ValidMagCtor = PrimitiveCtor | SerializableCtor;

declare type ValidMagClass = PrimitiveClass | Serializable;

declare type CtorData<T extends ValidMagCtor> =
    T extends PrimitiveCtor ? PrimitiveFromCtorType<T> :
    T extends SerializableCtor<infer I> ? I : never;

declare type CtorReadData<T extends ValidMagCtor, R extends boolean> =
    R extends true ? DeepReadonly<CtorData<T>> : CtorData<T>;

declare type CtorMutArgData<T extends ValidMagCtor, R extends boolean> =
    R extends true ? never : CtorData<T>;


/**
 * Converts a type T into a readonly version of itself, recursively.
 */
declare type DeepReadonly<T> =
    T extends Array<infer U> // arrays become readonly arrays
        ? ReadonlyArray<DeepReadonly<U>>
        : T extends Function
            ? T
        : T extends object // nested objects recurse
            ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
            : T; // primitives stay the same