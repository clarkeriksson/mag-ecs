// noinspection JSUnusedGlobalSymbols

import {
    IS_CLASS,
    IS_VALUE,
    IS_BOOLEAN,
    IS_TAG,
    IS_READONLY,
} from "../const/symbols.js";

import { Bitset } from "../util/bitset.js";
import { SparseSet } from "../util/sparse-set.js";

import type { DeepReadonly } from "../util/sparse-set.js";

export type Tupled<T extends readonly any[]> = { [K in keyof T]: T[K] };

export type Constructor<T = any, N extends string = string> = { new(...args: any[]): T, name: N };

/**
 * Type resolving to the instance type of the generic type parameter.
 */
// export type DataType<T extends Constructor | Value, R extends true | false> =
//     T extends Constructor ? (R extends true ? DeepReadonly<InstanceType<T>> : InstanceType<T>) : T;

// export type ComponentDataType<T extends Component<any, any, any>> =
//     T extends Component<infer Type, string, infer Readonly>
//         ? Type extends Constructor ? (Readonly extends true ? DeepReadonly<InstanceType<Type>> : InstanceType<Type>) : Type
//         : never;

// export type ArgDataType<T extends Constructor | Value, R extends true | false> =
//     T extends Constructor ? (R extends true ? never : InstanceType<T>) : (R extends true ? never : T);

// export type ComponentArgDataType<T extends Component<any, any, any>> =
//     T extends Component<infer Type, string, infer Readonly>
//         ? Type extends Constructor ? (Readonly extends true ? DeepReadonly<InstanceType<Type>> : InstanceType<Type>)
//         : (Readonly extends true ? never : T)
//         : never;

// export type SetDataType<T extends Constructor | Value, R extends true | false> =
//     T extends Constructor ? (R extends true ? DeepReadonly<InstanceType<T>> : InstanceType<T>)
//     : (R extends true ? never : T);

// export type ComponentReadonlyDataType<T extends Component<any, any, any>> =
//     T extends Component<infer Type, string, infer Readonly>
//         ? Type extends Constructor ? (Readonly extends true ? DeepReadonly<InstanceType<Type>> : InstanceType<Type>)
//         : (Readonly extends true ? never : T)
//         : never;

// export type Mutator<Type extends Constructor | Value, Readonly extends true | false> =
//     (current: ArgDataType<Type, Readonly>) => SetDataType<Type, Readonly> | void;

// export type AdderParameters<Type extends Constructor | Value> =
//     Type extends Constructor
//         ? ConstructorParameters<Type>
//         : [Type];

// export type ComponentAccessor<T extends Component<any, any, any>> =
//     T extends Component<infer Type, string, infer Readonly> ? {
//         readonly data: DataType<Type, Readonly>;
//         readonly component: T;
//         mutate: Readonly extends true ? never : (mutator: Mutator<Type, Readonly>) => void;
//     } : never;

export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue; }
export interface JSONArray extends Array<JSONValue> { }

export type PrimitiveCtors = StringConstructor | NumberConstructor | BooleanConstructor;
export type PrimitiveFromCtor<T extends PrimitiveCtors> =
    T extends StringConstructor ? string :
    T extends NumberConstructor ? number :
    T extends BooleanConstructor ? boolean :
    never;

export interface SerializableCtor<T = any, J = JSONValue> {
    new(...args: any[]): T;
    fromJSON(json: J): T;
    toJSON(value: T): J;
}

export type MagDataCtor<T = any, J = JSONValue> =
    | PrimitiveCtors
    | SerializableCtor<T, J>;

export type MagPrimitiveInstance<T extends PrimitiveCtors, R extends boolean> = PrimitiveFromCtor<T>;
export type MagArgPrimitiveInstance<T extends PrimitiveCtors, R extends boolean> = 
    R extends true ? never : PrimitiveFromCtor<T>;
export type MagReturnPrimitiveInstance<T extends PrimitiveCtors, R extends boolean> =
    R extends true ? never : PrimitiveFromCtor<T>;
export type MagCtorInstance<T extends SerializableCtor<any, any>, R extends boolean> =
    R extends true ? DeepReadonly<InstanceType<T>> : InstanceType<T>;
export type MagArgCtorInstance<T extends SerializableCtor<any, any>, R extends boolean> =
    R extends true ? never : InstanceType<T>;
export type MagReturnCtorInstance<T extends SerializableCtor<any, any>, R extends boolean> =
    R extends true ? never : InstanceType<T>;

export type MagDataCtorInstance<T extends MagDataCtor, R extends boolean> =
    T extends PrimitiveCtors ? MagPrimitiveInstance<T, R> :
    T extends SerializableCtor<any, any> ? MagCtorInstance<T, R> :
    never;

export type MagDataCtorInstanceByComponent<T extends Component<any, any, any>> =
    T extends Component<infer Type, string, infer Readonly>
        ? MagDataCtorInstance<Type, Readonly>
        : never;

export type MagComponentArgType<T extends Component<any, any, any>> =
    T extends Component<infer Type, string, infer Readonly>
        ? Type extends MagDataCtor
            ? Type extends SerializableCtor<any, any>
                ? MagArgCtorInstance<Type, Readonly>
                    ? Type extends PrimitiveCtors
                        ? MagArgPrimitiveInstance<Type, Readonly>
                        : never
            : never
        : never;

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

// export type ComponentAccessorTuple<T extends readonly Component<any, any, any>[]> = {
//     [K in keyof T]: Accessor<T[K]>;
// }

// export type ReadonlyDataMethod<T extends Accessor> = (data: ComponentReadonlyDataType<T['data']>) => void;

/**
 * Class used to access and automatically manage component-type information.
 * @class
 */
export class Component<
    Type extends MagDataCtor = MagDataCtor, 
    Name extends string = string, 
    Readonly extends boolean = boolean
> {

    private static _nextId: number = 0;

    private static _bitsetCache: Map<Component<any, string, boolean>[], Bitset> = new Map();

    private readonly [IS_CLASS]: boolean;
    private readonly [IS_VALUE]: boolean;
    private readonly [IS_BOOLEAN]: boolean;
    private readonly [IS_TAG]: boolean;

    private readonly [IS_READONLY]: Readonly;

    private readonly _name: Name;
    private readonly _id: number;
    private readonly _idBitset: Bitset;

    private readonly _constructor?: Constructor;

    public get id(): number { return this._id; }

    private readonly _store: SparseSet<DataType<Type, Readonly>>;

    private constructor({
        isTagType,
        isReadonly,
        name,
        ctor,
                        }: {
        isTagType: boolean;
        isReadonly: Readonly;
        name: Name;
        ctor?: Constructor;
    }) {

        this[IS_CLASS] = true;
        this[IS_VALUE] = true;
        this[IS_BOOLEAN] = true;
        this[IS_TAG] = isTagType;
        this[IS_READONLY] = isReadonly;
        this._name = name;

        this._store = new SparseSet<DataType<Type, Readonly>>();

        this._id = Component._nextId;
        Component._nextId++;

        this._idBitset = new Bitset();
        this._idBitset.set(this._id, true);

        this._constructor = ctor;

    }

    public static fromClass<T extends Constructor, N extends string, R extends boolean>({ ctor, name, readonly }: { ctor: T, name: N, readonly: R }) {

        return new Component<T, N, R>({
            isTagType: false,
            isReadonly: readonly,
            name: name,
            ctor,
        });

    }

    public static fromValue<T extends Value>() {

        return <N extends string, R extends boolean>({ name, readonly }: { name: N, readonly: R }) => {

            return new Component<T, N, R>({
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