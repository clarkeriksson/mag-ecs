export interface ClassDefinition<T = any> {
    new(...args: any[]): T;
}

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
const TAG = Symbol("tag_class");
const STRING = Symbol("string_class");
const NUMBER = Symbol("number_class");
const BOOLEAN = Symbol("boolean_class");

export namespace MagTypes {
    export class Tag {
        private static readonly [TAG] = true;
        private readonly [TAG] = true;
        static fromJSON(_json: true) { return true as true; }
        static toJSON(_value: true) { return true as true; }
    }
    
    export class String {
        private static readonly [STRING] = true;
        private readonly [STRING] = true;
        static fromJSON(json: string) { return json; }
        static toJSON(value: string) { return value; }
    }
    
    export class Number {
        private static readonly [NUMBER] = true;
        private readonly [NUMBER] = true;
        static fromJSON(json: number) { return json; }
        static toJSON(value: number) { return value; }
    }
    
    export class Boolean {
        private static readonly [BOOLEAN] = true;
        private readonly [BOOLEAN] = true;
        static fromJSON(json: boolean) { return json; }
        static toJSON(value: boolean) { return value; }
    }
}

/**
 * Primitive constructor types used in mag-ecs components.
 */
export type PrimitiveCtor = 
    | typeof MagTypes.String 
    | typeof MagTypes.Number 
    | typeof MagTypes.Boolean 
    | typeof MagTypes.Tag;

export type PrimitiveFromCtorType<C extends PrimitiveCtor> =
    C extends typeof MagTypes.String ? string :
    C extends typeof MagTypes.Number ? number :
    C extends typeof MagTypes.Boolean ? boolean :
    true;

export type JSONValue = string | number | boolean | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue; }
export interface JSONArray extends Array<JSONValue> {}

export type JSONRepresentation<I extends Serializable> =
    I extends Serializable<any, infer J> ? J : never;

export interface Serializable<I = any, J extends JSONValue = JSONValue> {
    toJSON(value: I): J;
    fromJSON(value: J): I;
}

export interface SerializableCtor<I = any, J extends JSONValue = JSONValue> extends Serializable<I, J> {
    new(...args: any[]): I;
}

export interface Ctor<I = any> {
    new(...args: any[]): I;
}

// class TestClass {
//     public x: number;
//     public n: string;
//     constructor(x: number, n: string) {
//         this.x = x;
//         this.n = n;
//     }
//     toJSON() {
//         return {
//             x: this.x,
//             n: this.n,
//         }
//     }
//     static fromJSON(json: {x: number, n: string}) {
//         return new TestClass(json.x, json.n);
//     }
// }

// type Test = MagJSONRepresentation<typeof Tag>;

export type ValidMagCtor = PrimitiveCtor | SerializableCtor | Ctor;

export type IsSerializable<T extends ValidMagCtor> =
    T extends SerializableCtor<any, any>
    ? true
    : false;

export type SerializationTarget<T extends ValidMagCtor> = 
    T extends SerializableCtor<any, infer J>
    ? J
    : never;

export type CtorData<T extends ValidMagCtor> =
    T extends PrimitiveCtor ? PrimitiveFromCtorType<T> :
    T extends SerializableCtor<infer I, any> ? I : never;

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