// noinspection JSUnusedGlobalSymbols

import { Bitset } from "../util/bitset.js";
import { SparseSet } from "../util/sparse-set.js";
import { SparseBitSet } from "../util/sparse-bit-set.js";
import { SparseTagSet } from "../util/sparse-tag-set.js";

import type { DeepReadonly } from "../util/sparse-set.js";
import type { ISparseSet } from "../util/sparse-set.js";
import { ArrayPool } from "../util/array-pool.js";
import {World} from "./world";

export type Tupled<T extends readonly any[]> = { [K in keyof T]: T[K] };

export type Constructor<T = any> = { new(...args: any[]): T };

type UnionToArray<T> = T extends any ? T[] : never;

/**
 * Non-static, non-readonly component type with class instance data.
 */
export type ClassComponentType<T extends Constructor, N extends string> = {
    readonly name: N;
    readonly __isClassType: true;
    readonly __isValueType: false;
    readonly __isBooleanType: false;
    readonly __isTagType: false;
    readonly __readonly: false;
    new (...args: ConstructorParameters<T>): InstanceType<T>;
}

/**
 * Non-static, non-readonly component type with value data.
 */
export type ValueComponentType<T extends Value, N extends string> = {
    readonly name: N;
    readonly __isClassType: false;
    readonly __isValueType: true;
    readonly __isBooleanType: boolean;
    readonly __isTagType: boolean;
    new (arg: T): T;
}

/**
 * Non-static, readonly component type with class instance data.
 */
export type ReadonlyClassComponentType<T extends Constructor, N extends string> = {
    readonly name: N;
    readonly __isClassType: true;
    readonly __isValueType: false;
    readonly __isBooleanType: false;
    readonly __isTagType: false;
    new (...args: ConstructorParameters<T>): DeepReadonly<InstanceType<T>>;
}

/**
 * Non-static, readonly component type with value data.
 */
export type ReadonlyValueComponentType<T extends Value, N extends string> = {
    readonly name: N;
    readonly __isClassType: false;
    readonly __isValueType: true;
    readonly __isBooleanType: boolean;
    readonly __isTagType: boolean;
    new (arg: T): T;
}

/**
 * Type resolving the generic type parameters to a specific 'component-type' type.
 */
export type ComponentType<T extends Constructor | Value, N extends string, Readonly extends boolean> =
    T extends Constructor
        ? (
            Readonly extends true
                ? ReadonlyClassComponentType<T, N>
                : Readonly extends false ? ClassComponentType<T, N> : never
        ) : T extends Value ? (
            Readonly extends true
                ? ReadonlyValueComponentType<T, N>
                : Readonly extends false ? ValueComponentType<T, N> : never
        ) : never;

/**
 * Type resolving the generic 'component-type' type parameter to a specific 'component-instance' type.
 */
export type ComponentTypeInstance<Type extends Constructor | Value, Readonly extends boolean> =
    Type extends Constructor
        ? Readonly extends true ? DeepReadonly<InstanceType<Type>> : InstanceType<Type>
        : Type;

/**
 * Non-nullish primitive types used in mag-ecs.
 */
export type ValuePrimitive = number | string | boolean;
/**
 * Array types with non-nullish primitive type data used in mag-ecs.
 */
export type ValueArray = UnionToArray<ValuePrimitive>;
/**
 * Union of primitive and array value types.
 */
export type Value = ValuePrimitive | ValueArray;
/**
 * Restricted object type where any leaf properties must be primitives or arrays of primitives.
 */
export type ValueObject = { [key: string]: Value | ValueObject };

/**
 * Type resolving to the instance type of the generic type parameter.
 */
export type DataType<T extends Constructor | Value, R extends true | false> =
    T extends Constructor ? (R extends true ? DeepReadonly<InstanceType<T>> : InstanceType<T>) : T;

export type ComponentDataType<T extends Component<any, any, any>> =
    T extends Component<infer Type, string, infer Readonly>
        ? Type extends Constructor ? (Readonly extends true ? DeepReadonly<InstanceType<Type>> : InstanceType<Type>) : Type
        : never;

export type ArgDataType<T extends Constructor | Value, R extends true | false> =
    T extends Constructor ? (R extends true ? never : InstanceType<T>) : (R extends true ? never : T);

export type ComponentArgDataType<T extends Component<any, any, any>> =
    T extends Component<infer Type, string, infer Readonly>
        ? Type extends Constructor ? (Readonly extends true ? DeepReadonly<InstanceType<Type>> : InstanceType<Type>)
        : (Readonly extends true ? never : T)
        : never;

export type SetDataType<T extends Constructor | Value, R extends true | false> =
    T extends Constructor ? (R extends true ? DeepReadonly<InstanceType<T>> : InstanceType<T>)
    : (R extends true ? never : T);

export type ComponentSetDataType<T extends Component<any, any, any>> =
    T extends Component<infer Type, string, infer Readonly>
        ? Type extends Constructor ? (Readonly extends true ? DeepReadonly<InstanceType<Type>> : InstanceType<Type>)
        : (Readonly extends true ? never : T)
        : never;

export type Mutator<Type extends Constructor | Value, Readonly extends true | false> =
    (current: ArgDataType<Type, Readonly>) => SetDataType<Type, Readonly> | void;

export type AdderParameters<Type extends Constructor | Value> =
    Type extends Constructor
        ? ConstructorParameters<Type>
        : [Type];

export type ComponentAccessor<T extends Component<any, any, any>> =
    T extends Component<infer Type, string, infer Readonly> ? {
        readonly data: DataType<Type, Readonly>;
        readonly component: T;
        mutate: Readonly extends true ? never : (mutator: Mutator<Type, Readonly>) => void;
    } : never;

export type ComponentAccessorTuple<T extends readonly Component<any, any, any>[]> = {
    [K in keyof T]: ComponentAccessor<T[K]>;
}

export class Accessor<
    T extends Component<any, any, any>,
    R = T extends Component<any, any, infer Readonly> ? Readonly : never
> {
    public entity = -1;
    public data: any;
    public component!: T;

    public mutate(mutator: (current: ComponentArgDataType<T>) => ComponentSetDataType<T> | void): void {
        this.component.mutate(this.entity, mutator);
    }
}

/**
 * Class used to access and automatically manage component-type information.
 * @class
 */
export class Component<Type extends Constructor | Value, Name extends string, Readonly extends boolean> {

    private static _nextId: number = 0;

    private static _bitsetCache: Map<Component<any, string, boolean>[], Bitset> = new Map();

    private readonly __isClassType: boolean;
    private readonly __isValueType: boolean;
    private readonly __isBooleanType: boolean;
    private readonly __isTagType: boolean;

    private readonly __readonly: Readonly;

    private readonly __name: Name;
    private readonly _id: number;
    private readonly _idBitset: Bitset;

    public get id(): number { return this._id; }

    private readonly _store: ISparseSet<DataType<Type, Readonly>>;

    private constructor({
        isClassType,
        isValueType,
        isBooleanType,
        isTagType,
        isReadonly,
        name,
                        }: {
        isClassType: boolean;
        isValueType: boolean;
        isBooleanType: boolean;
        isTagType: boolean;
        isReadonly: Readonly;
        name: Name;
    }) {

        this.__isClassType = isClassType;
        this.__isValueType = isValueType;
        this.__isBooleanType = isBooleanType;
        this.__isTagType = isTagType;
        this.__readonly = isReadonly;
        this.__name = name;

        this._store = new SparseSet<DataType<Type, Readonly>>();

        this._id = Component._nextId;
        Component._nextId++;

        this._idBitset = new Bitset();
        this._idBitset.set(this._id, true);

    }

    public static fromClass<T extends Constructor>() {

        return <N extends string, R extends boolean>(name: N, readonly: R) => {

            return new Component<T, N, R>({
                isClassType: true,
                isValueType: false,
                isBooleanType: false,
                isTagType: false,
                isReadonly: readonly,
                name: name,
            });

        }

    }

    public static fromValue<T extends Value>() {

        return <N extends string, R extends boolean>(name: N, readonly: R) => {

            return new Component<T, N, R>({
                isClassType: false,
                isValueType: true,
                isBooleanType: false,
                isTagType: false,
                isReadonly: readonly,
                name: name,
            });

        }

    }

    public get(entity: number): DataType<Type, Readonly> | undefined {

        return this._store.get(entity);

    }

    public __get(entity: number): DataType<Type, Readonly> {

        return this._store.get(entity)!;

    }

    private _set(entity: number, value: DataType<Type, Readonly>): void {

        this._store.set(entity, value);

    }

    public add(entity: number, value: DataType<Type, Readonly>): boolean {

        return this._store.add(entity, value);

    }

    public remove(entity: number): boolean {

        const removed = this._store.remove(entity);
        return removed !== undefined;

    }

    public mutate(entity: number, mutator: Readonly extends true ? never : (current: ArgDataType<Type, Readonly>) => SetDataType<Type, Readonly> | void): void {

        const current = this.get(entity) as DataType<Type, false>;

        if (!current) return;

        const newValue = mutator(current);

        if (newValue !== undefined) {

            console.log(newValue);
            this._store.set(entity, newValue);

        }

    }

    public static bitsetFromTypes(...types: Component<any, string, boolean>[]): Bitset {

        if (Component._bitsetCache.has(types)) {

            return Component._bitsetCache.get(types)!;

        }

        return Bitset.or(...types.map(type => type._idBitset));

    }

    public static getQueryComponents(entities: number[], types: Component<any, string, boolean>[]): DataType<any, boolean>[] {

        const result = new Array(entities.length * types.length);

        for (let i = 0; i < entities.length; i++) {

            const entity = entities[i];

            for (let j = 0; j < types.length; j++) {

                const type = types[j];

                result[i * types.length + j] = type.__get(entity);

            }

        }

        return result;

    }

}