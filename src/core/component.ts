// noinspection JSUnusedGlobalSymbols

import { Bitset } from "../util/bitset.js";
import { SparseSet } from "../util/sparse-set.js";

import type { DeepReadonly } from "../util/sparse-set.js";

export type Tupled<T extends readonly any[]> = { [K in keyof T]: T[K] };

export type Constructor<T = any, N extends string = string> = { new(...args: any[]): T, name: N };

type UnionToArray<T> = T extends any ? T[] : never;

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

export type ComponentReadonlyDataType<T extends Component<any, any, any>> =
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

export class Accessor<T extends Component = Component> {
    public entity = -1;
    public readonly data!: T extends Component<infer Type, string, any> 
        ? Type extends Constructor 
            ? DeepReadonly<InstanceType<Type>> 
            : DeepReadonly<Type>
        : never;
    public component!: T;

    public mutate(mutator: (current: ComponentArgDataType<T>) => ComponentReadonlyDataType<T> | void): void {
        this.component.mutate(this.entity, mutator);
    }
}

export type ComponentAccessorTuple<T extends readonly Component<any, any, any>[]> = {
    [K in keyof T]: Accessor<T[K]>;
}

export type ReadonlyDataMethod<T extends Accessor> = (data: ComponentReadonlyDataType<T['data']>) => void;

/**
 * Class used to access and automatically manage component-type information.
 * @class
 */
export class Component<Type extends Constructor | Value = Constructor | Value, Name extends string = string, Readonly extends boolean = boolean> {

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

    private readonly _constructor?: Constructor;

    public get id(): number { return this._id; }

    private readonly _store: SparseSet<DataType<Type, Readonly>>;

    private constructor({
        isClassType,
        isValueType,
        isBooleanType,
        isTagType,
        isReadonly,
        name,
        ctor,
                        }: {
        isClassType: boolean;
        isValueType: boolean;
        isBooleanType: boolean;
        isTagType: boolean;
        isReadonly: Readonly;
        name: Name;
        ctor?: Constructor;
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

        this._constructor = ctor;

    }

    public static fromClass<T extends Constructor, N extends string, R extends boolean>({ ctor, name, readonly }: { ctor: T, name: N, readonly: R }) {

        return new Component<T, N, R>({
            isClassType: true,
            isValueType: false,
            isBooleanType: false,
            isTagType: false,
            isReadonly: readonly,
            name: name,
            ctor,
        });

    }

    public static fromValue<T extends Value>() {

        return <N extends string, R extends boolean>({ name, readonly }: { name: N, readonly: R }) => {

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

        return this._store.__get(entity)!;

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

            //console.log(newValue);
            this._store.set(entity, newValue);

        }

    }

    public static bitsetFromTypes(...types: Component[]): Bitset {

        if (Component._bitsetCache.has(types)) {

            return Component._bitsetCache.get(types)!;

        }

        return Bitset.or(...types.map(type => type._idBitset));

    }

    public static getQueryComponents(entities: number[], types: (readonly Component[])): DataType<any, any>[] {

        const entitiesLength = entities.length;
        const typesLength = types.length;
        const result = new Array(entitiesLength * typesLength);

        for (let j = 0; j < typesLength; j++) {

            const type = types[j];

            type._store.__getBatch(entities, result, typesLength, j);

        }

        return result;

    }

}

export function component<N extends string>(name: N) {

    return {

        value<T extends Value = Value>() {

            return {

                immutable: () => Component.fromValue<T>()({ name, readonly: true }),
                mutable: () => Component.fromValue<T>()({ name, readonly: false }),

            }

        },

        class: <T extends Constructor = Constructor>(ctor: T) => {

            return {

                immutable: () => Component.fromClass({ ctor, name, readonly: true }),
                mutable: () => Component.fromClass({ ctor, name, readonly: false }),

            }

        }

    }

}