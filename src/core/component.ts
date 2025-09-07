// noinspection JSUnusedGlobalSymbols

import type {
    ValidMagCtor,
    CtorMutArgData,
    CtorData,
    CtorReadData,
    JSONRepresentation,
    SerializableCtor,
    Serializable,
    JSONValue,
    SerializationTarget,
    IsSerializable,
} from "../globals";

import {
    MagTypes
} from "../globals";

import {
    IS_CLASS,
    IS_VALUE,
    IS_BOOLEAN,
    IS_TAG,
    IS_READONLY,
    SERIALIZED,
} from "../const/symbols.js";

import { Bitset } from "../util/bitset.js";
import { SparseSet } from "../util/sparse-set.js";

export interface ClassDefinition<T = any> {
    new(...args: any[]): T;
}

export type CmpCtor<C extends Component> =
    C extends Component<infer Type, string, any>
        ? Type
        : never;

export type CmpName<C extends Component> =
    C extends Component<any, infer Name, any>
        ? Name
        : never;

export type CmpReadonly<C extends Component> =
    C extends Component<any, string, infer Readonly>
        ? Readonly
        : never;

export type MutFn<T extends Component = Component> = (current: CtorMutArgData<CmpCtor<T>, CmpReadonly<T>>) => CtorMutArgData<CmpCtor<T>, CmpReadonly<T>> | void;

export class Accessor<T extends Component = Component> {
    public entity = -1;
    public readonly data!: CtorReadData<CmpCtor<T>, CmpReadonly<T>>;
    public component!: T;

    public mutate(mutator: CmpReadonly<T> extends true ? never : MutFn<T>): void {
        this.component.mutate(this.entity, mutator);
    }
}

export type CmpAccTuple<T extends readonly Component[] = readonly Component[]> = {
    [K in keyof T]: Accessor<T[K]>
}

/**
 * Class describing component definitions. Importantly NOT describing individual instances
 * of component data, only the container for the sparse set of said instances.
 * @class
 */
export class Component<
    Type extends ValidMagCtor = ValidMagCtor, 
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
    private readonly [SERIALIZED]: boolean;

    private readonly _name: Name;
    private readonly _id: number;
    private readonly _idBitset: Bitset;

    private readonly _constructor: ValidMagCtor;

    public get id(): number { return this._id; }

    private readonly _store: SparseSet<CtorReadData<Type, Readonly>>;

    private constructor({
        isTagType,
        isReadonly,
        name,
        ctor,
        jsonOptOut = false,
    }: {
        isTagType: boolean;
        isReadonly: Readonly;
        name: Name;
        ctor: ValidMagCtor;
        jsonOptOut?: boolean;
    }) {

        this[IS_CLASS] = true;
        this[IS_VALUE] = true;
        this[IS_BOOLEAN] = true;
        this[IS_TAG] = isTagType;
        this[IS_READONLY] = isReadonly;

        const typeOwnProps = Object.getOwnPropertyDescriptors(ctor);
        this[SERIALIZED] = ("toJSON" in typeOwnProps) && ("fromJSON" in typeOwnProps) && !jsonOptOut;
        
        this._name = name;

        this._store = new SparseSet<CtorReadData<Type, Readonly>>();

        this._id = Component._nextId;
        Component._nextId++;

        this._idBitset = new Bitset();
        this._idBitset.set(this._id, true);

        this._constructor = ctor;

    }

    public static fromClass<T extends ValidMagCtor, N extends string, R extends boolean>({ ctor, name, readonly, jsonOptOut = false }: { ctor: T, name: N, readonly: R, jsonOptOut?: boolean }) {

        return new Component<T, N, R>({
            isTagType: false,
            isReadonly: readonly,
            name: name,
            ctor,
            jsonOptOut,
        });

    }

    public static tag<N extends string>({ name, jsonOptOut = false }: { name: N, jsonOptOut?: boolean }): Component<typeof MagTypes.Tag, N, true> {
        return new Component<typeof MagTypes.Tag, N, true>({
            isTagType: true,
            isReadonly: true,
            name,
            ctor: MagTypes.Tag,
            jsonOptOut,
        })
    }

    public get(entity: number): CtorReadData<Type, Readonly> | undefined {

        return this._store.get(entity);

    }

    public __get(entity: number): CtorReadData<Type, Readonly> {

        return this._store.__get(entity)!;

    }

    private _set(entity: number, value: CtorReadData<Type, Readonly>): void {

        this._store.set(entity, value);

    }

    public add(entity: number, value: CtorReadData<Type, Readonly>): boolean {

        return this._store.add(entity, value);

    }

    public remove(entity: number): boolean {

        const removed = this._store.remove(entity);
        return removed !== undefined;

    }

    public mutate(entity: number, mutator: MutFn<Component<Type, string, Readonly>>): void {

        const current = this.get(entity) as CtorData<Type>;

        if (!current) return;

        const newValue = mutator(current as CtorMutArgData<Type, Readonly>);

        if (newValue !== undefined) {

            this._store.set(entity, newValue as CtorReadData<Type, Readonly>);

        }

    }

    public static bitsetFromTypes(...types: Component[]): Bitset {

        if (Component._bitsetCache.has(types)) {

            return Component._bitsetCache.get(types)!;

        }

        return Bitset.or(...types.map(type => type._idBitset));

    }

    public static getQueryComponents(entities: number[], types: (readonly Component[])): CtorReadData<any, any>[] {

        const entitiesLength = entities.length;
        const typesLength = types.length;
        const result = new Array(entitiesLength * typesLength);

        for (let j = 0; j < typesLength; j++) {

            const type = types[j];

            type._store.__getBatch(entities, result, typesLength, j);

        }

        return result;

    }

    public toJSON() {

        if (!this[SERIALIZED]) return;

        const serializableCtor = this._constructor as SerializableCtor;

        const result: {
            name: Name,
            store: { entity: number, value: JSONValue }[],
        } = {
            name: this._name,
            store: [],
        };

        this._store.map((entity: number, value: CtorReadData<Type, Readonly>) => {
            
        });

        return result;

    }

}

class ComponentBuilder<
    Type extends ValidMagCtor = ValidMagCtor,
    Name extends string = string,
    Readonly extends boolean = boolean
> {

    private ctor: ValidMagCtor | null = null;
    private name: string | null = null;
    private readonly: boolean | null = null;
    private serialized: boolean | null = null;

    constructor() {
        
    }

    public type<T extends ValidMagCtor>(type: T): ComponentBuilder<T, Name, Readonly> {
        this.ctor = type;
        return this as ComponentBuilder<T, Name, Readonly>;
    }

    public string(): ComponentBuilder<typeof MagTypes.String, Name, Readonly> {
        this.ctor = MagTypes.String;
        return this as ComponentBuilder<typeof MagTypes.String, Name, Readonly>;
    }

    public number(): ComponentBuilder<typeof MagTypes.Number, Name, Readonly> {
        this.ctor = MagTypes.Number;
        return this as ComponentBuilder<typeof MagTypes.Number, Name, Readonly>;
    }

    public boolean(): ComponentBuilder<typeof MagTypes.Boolean, Name, Readonly> {
        this.ctor = MagTypes.Boolean;
        return this as ComponentBuilder<typeof MagTypes.Boolean, Name, Readonly>;
    }

    public tag(): ComponentBuilder<typeof MagTypes.Tag, Name, true> {
        this.ctor = MagTypes.Tag;
        return this as ComponentBuilder<typeof MagTypes.Tag, Name, true>;
    }

    public mutable(): ComponentBuilder<Type, Name, false> {
        this.readonly = false;
        return this as ComponentBuilder<Type, Name, false>;
    }

    public immutable(): ComponentBuilder<Type, Name, true> {
        this.readonly = true;
        return this as ComponentBuilder<Type, Name, true>;
    }

    public nonserialized(): ComponentBuilder<Type, Name, Readonly> {
        this.serialized = false;
        return this as ComponentBuilder<Type, Name, Readonly>;
    }

}

export function component<N extends string>(name: N) {

    return {

        immutable: <T extends ValidMagCtor>(ctor: T) => Component.fromClass({ ctor, name, readonly: true }),
        mutable: <T extends ValidMagCtor>(ctor: T) => Component.fromClass({ ctor, name, readonly: false }),
        tag: () => Component.tag(name),

    }

}

class TestClass {
    prop: string;
    constructor(prop: string) {
        this.prop = prop;
    }
    toJSON() {
        return { prop: this.prop };
    }
    static fromJSON(json: { prop: string }) {
        return new TestClass(json.prop);
    }
}

// var test = component("Name").immutable(Boolean);
// var testAcc = new Accessor<typeof test>();
// testAcc.component = test;
// testAcc.entity = 1;
// (testAcc.data as any) = new TestClass("Hello");

// testAcc.mutate((current) => {
//     current = false;
// });