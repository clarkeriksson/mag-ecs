export interface ClassDefinition<T = any> {
    new(...args: any[]): T;
}

/**
 * Non-nullish primitive types used in mag-ecs components.
 */
export type Value = number | string | boolean;

/**
 * Transforms union types into a union type of each union member's array-type.
 * For example, 'string | number | Date' goes to 'string[] | number[] | Date[]'.
 */
export type UnionToArray<T> = T extends any ? T[] : never;

const TAG = Symbol("Mag-ECS Tag Data Class Identifying Property");
const STRING = Symbol("Mag-ECS String Data Class Identifying Property");
const NUMBER = Symbol("Mag-ECS Number Data Class Identifying Property");
const BOOLEAN = Symbol("Mag-ECS Boolean Data Class Identifying Property");

export namespace MagTypes {

    export class Tag {
        private static readonly [TAG] = true;
        private readonly [TAG] = true;
        static fromJSON(json: true) { return true as true; }
        static toJSON(value: true) { return true as true; }
        constructor() {}
    }
    
    export class String {
        private static readonly [STRING] = true;
        private readonly [STRING] = true;
        static fromJSON(json: string) { return json; }
        static toJSON(value: string) { return value; }
        constructor() {}
    }
    
    export class Number {
        private static readonly [NUMBER] = true;
        private readonly [NUMBER] = true;
        static fromJSON(json: number) { return json; }
        static toJSON(value: number) { return value; }
        constructor() {}
    }
    
    export class Boolean {
        private static readonly [BOOLEAN] = true;
        private readonly [BOOLEAN] = true;
        static fromJSON(json: boolean) { return json; }
        static toJSON(value: boolean) { return value; }
        constructor() {}
    }

}

/**
 * Primitive constructor types used in mag-ecs components.
 */
export type MagValueCtor = 
    | typeof MagTypes.String 
    | typeof MagTypes.Number 
    | typeof MagTypes.Boolean 
    | typeof MagTypes.Tag;

export type MagValueClass = 
    | MagTypes.String
    | MagTypes.Number
    | MagTypes.Boolean
    | MagTypes.Tag;

export type DataFromMagCtor<C extends MagValueCtor> =
    C extends typeof MagTypes.String ? string :
    C extends typeof MagTypes.Number ? number :
    C extends typeof MagTypes.Boolean ? boolean :
    true;

export type DataFromMagClass<C> =
    C extends MagTypes.String ? string :
    C extends MagTypes.Number ? number :
    C extends MagTypes.Boolean ? boolean :
    C extends MagTypes.Tag ? true :
    C;

export type JSONValue = string | number | boolean | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue; }
export interface JSONArray extends Array<JSONValue> {}

export type JSON<I> = I extends Serializable<unknown, infer J> ? J : never;

/**
 * Interface describing an object that can serialize a value of type T to the JSON type Json.
 */
export interface Serializable<T, Json extends JSONValue> {
    toJSON(value: T): Json;
    fromJSON(value: Json): T;
}

export interface MagDataClassCtor<Inst, Json extends JSONValue, Data = DataFromMagClass<Inst>> extends Serializable<Data, Json> {
    new(...args: any[]): Inst;
}

export type CtorData<T extends MagDataClassCtor<unknown, JSONValue, unknown>> = T extends MagDataClassCtor<unknown, JSONValue, infer Data> ? Data : never;

export type CtorReadData<T extends MagDataClassCtor<unknown, JSONValue>, R extends boolean> =
    R extends true ? DeepReadonly<CtorData<T>> : CtorData<T>;

export type CtorMutArgData<T extends MagDataClassCtor<unknown, JSONValue>, R extends boolean> =
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