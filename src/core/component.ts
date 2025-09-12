// noinspection JSUnusedGlobalSymbols

import type {
    MagDataClassCtor,
    CtorMutArgData,
    CtorData,
    CtorReadData,
    JSON,
    Serializable,
    JSONValue,
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
} from "../const/symbols.js";

import { Bitset } from "../util/bitset.js";
import { SparseSet } from "../util/sparse-set.js";
import { Query } from "./query";
import { World } from "./world";

export interface ClassDefinition<T = any> {
    new(...args: any[]): T;
}

export type MutFn<
    Inst,
    Data,
    Json extends JSONValue,
    Type extends MagDataClassCtor<Inst, Json, Data>, 
    Name extends string, 
    Read extends boolean
> = 
    (current: CtorMutArgData<Type, Read>) => CtorMutArgData<Type, Read> | void;

export class Accessor<
    Inst = unknown,
    Data = unknown,
    Json extends JSONValue = JSONValue,
    Type extends MagDataClassCtor<Inst, Json, Data> = MagDataClassCtor<Inst, Json, Data>, 
    Name extends string = string, 
    Read extends boolean = boolean
> {
    public entity = -1;
    public readonly data!: CtorReadData<Type, Read>;
    public component!: Component<Inst, Data, Json, Type, Name, Read>;

    public mutate(mutator: Read extends true ? never : MutFn<Inst, Data, Json, Type, Name, Read>): void {
        this.component.mutate(this.entity, mutator);
    }
}

export type CmpAccTuple<T extends readonly Component[] = readonly Component[]> = {
    [K in keyof T]: T[K] extends Component<infer Inst, infer Data, infer Json, infer Type, infer Name, infer Read> ? Accessor<Inst, Data, Json, Type, Name, Read> : never;
}

/**
 * Class describing component definitions. Importantly NOT describing individual instances
 * of component data, only the container for the sparse set of said instances.
 * @class
 */
export class Component<
    Inst = any,
    Data = any,
    Json extends JSONValue = JSONValue,
    Type extends MagDataClassCtor<Inst, Json, Data> = MagDataClassCtor<Inst, Json, Data>, 
    Name extends string = string, 
    Read extends boolean = boolean,
    Comm extends boolean = boolean,
> {

    private static _nextId: number = 0;

    private static _bitsetCache: Map<Component[], Bitset> = new Map();

    private static _nameMap: Map<string, Component> = new Map();

    private readonly [IS_CLASS]: boolean;
    private readonly [IS_VALUE]: boolean;
    private readonly [IS_BOOLEAN]: boolean;
    private readonly [IS_TAG]: boolean;

    private readonly [IS_READONLY]: Read;

    private readonly _name: Name;
    private readonly _id: number;
    private readonly _idBitset: Bitset;

    private readonly _constructor: MagDataClassCtor<Inst, Json, Data>;

    public get id(): number { return this._id; }

    private readonly _store: SparseSet<CtorData<Type>>;

    public constructor({
        isTagType,
        isReadonly,
        name,
        ctor,
    }: {
        isTagType: boolean;
        isReadonly: Read;
        name: Name;
        ctor: MagDataClassCtor<Inst, Json, Data>;
    }) {

        this[IS_CLASS] = true;
        this[IS_VALUE] = true;
        this[IS_BOOLEAN] = true;
        this[IS_TAG] = isTagType;
        this[IS_READONLY] = isReadonly;
        
        this._name = name;

        this._store = new SparseSet<CtorData<Type>>();

        this._id = Component._nextId;
        Component._nextId++;

        this._idBitset = new Bitset();
        this._idBitset.set(this._id, true);

        this._constructor = ctor;

        Component._nameMap.set(this._name, this);

    }

    public static fromClass<
        I,
        D,
        J extends JSONValue,
        T extends MagDataClassCtor<I, J, D>, 
        N extends string, 
        R extends boolean
    >({ ctor, name, readonly }: { ctor: T, name: N, readonly: R, jsonOptOut?: boolean }) {

        return new Component<I, D, J, T, N, R>({
            isTagType: false,
            isReadonly: readonly,
            name: name,
            ctor,
        });

    }

    public static tag<N extends string>({ name }: { name: N }) {

        return new Component<
            MagTypes.Tag,
            true,
            true,
            typeof MagTypes.Tag, 
            N, 
            true
        >({
            isTagType: true,
            isReadonly: true,
            name,
            ctor: MagTypes.Tag,
        });

    }

    public get(entity: number): CtorReadData<Type, Read> | undefined {

        return this._store.get(entity) as CtorReadData<Type, Read> | undefined;

    }

    public __get(entity: number): CtorData<Type> {

        return this._store.__get(entity)!;

    }

    private _set(entity: number, value: CtorData<Type>): void {

        this._store.set(entity, value);

    }

    public add(entity: number, value: CtorData<Type>): boolean {

        return this._store.add(entity, value);

    }

    public remove(entity: number): boolean {

        const removed = this._store.remove(entity);
        return removed !== undefined;

    }

    public mutate(entity: number, mutator: MutFn<Inst, Data, Json, Type, Name, Read>): void {

        const current = this.get(entity) as CtorData<Type>;

        if (!current) return;

        const newValue = mutator(current as CtorMutArgData<Type, Read>);

        if (newValue !== undefined) {

            this._store.set(entity, newValue as CtorData<Type>);

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

    public static getQueryComponentLists<
        Q extends Query,
        Cmps extends readonly Component[] = Q extends Query<infer Types> ? Types : never,
        Data extends readonly any[] = CmpDataTuple<Cmps>,
        List = ToArrays<Data>,
    >(query: Q, entities: number[]): List {

        const result = [];

        for (const component of query.paramTypes) {

            const data: any[] = [];

            component._store.__getMany(entities, data);

            result.push(data);

        }

        return result as List;

    }

    public toJSON(): {
        name: Name,
        store: { entity: number, data: Json }[],
    } {

        const result: {
            name: Name,
            store: { entity: number, data: Json }[],
        } = {
            name: this._name,
            store: [],
        };

        const ctor = this._constructor;

        this._store.map((entity: number, value: Data) => {

            result.store.push({

                entity,
                data: ctor.toJSON(value),

            })

        });

        return result;

    }

    public static fromJSON(json: {
        name: string,
        store: { entity: number, data: JSONValue }[]
    }) {

        const component = Component._nameMap.get(json.name);

        if (!component) {

            throw new Error(`Component.fromJSON: failed to retrieve a component instance.`);

        }

        const ctor = component._constructor;

        try {

            const parsedEntries = [];

            for (const entry of json.store) {

                parsedEntries.push({
                    entity: entry.entity,
                    data: ctor.fromJSON(entry.data),
                });

            }

            component._store.fromList(parsedEntries);

        } catch (e) {

            console.warn(`Component.fromJSON: ${e}`);

        }

    }

}

class TestClass {
    public a: string = "hi";
    public B: number = 1;

    constructor(a: string, B: number) {
        this.a = a;
        this.B = B;
    }

    static fromJSON(json: {a: string, B: number}): TestClass {
        return new TestClass(json.a, json.B);
    }

    static toJSON(value: TestClass): { a: string, B: number } {
        return { a: value.a, B: value.B };
    }
}

var test = new Component({
    isTagType: false,
    isReadonly: true,
    name: "TestManual",
    ctor: TestClass,
});

/**
 * Component builder utility fn, made to make {@link Component} definitions easier
 * to interpret visually than when using the {@link Component} constructor.
 * 
 * @param {string} name The component name.
 * 
 * @example 
 * // Equivalent JS for a string component.
 * const cmp = new Component({ isTagType: false, isReadonly: true, name: "StringCmp", ctor: MagTypes.String });
 * const cmp = component("StringCmp").string().immutable();
 * 
 * // Equivalent JS for a class component using 'DataClass' instances as data.
 * const classCmp = new Component({ isTagType: false, isReadonly: false, name: "ClassCmp", ctor: DataClass });
 * const classCmp = component("ClassCmp").class(DataClass).mutable();
 */
export function component<Name extends string>(name: Name) {

    return {

        class<T extends MagDataClassCtor<any, any, any>>(ctor: T) {

            type Inst = T extends MagDataClassCtor<infer I, any, any> ? I : never;
            type Json = T extends MagDataClassCtor<any, infer J, any> ? J : never;
            type Data = T extends MagDataClassCtor<any, any, infer D> ? D : never;

            return {

                immutable(): Component<Inst, Data, Json, T, Name, true> {

                    return new Component<Inst, Data, Json, T, Name, true>({
                        isTagType: false,
                        isReadonly: true,
                        name,
                        ctor,
                    });

                },

                mutable(): Component<Inst, Data, Json, T, Name, false> {

                    return new Component<Inst, Data, Json, T, Name, false>({
                        isTagType: false,
                        isReadonly: false,
                        name,
                        ctor,
                    })

                }

            }

        },

        string() {
            
            return {

                immutable() {

                    return new Component({
                        isTagType: false,
                        isReadonly: true,
                        name,
                        ctor: MagTypes.String,
                    });

                },

                mutable() {

                    return new Component({
                        isTagType: false,
                        isReadonly: false,
                        name,
                        ctor: MagTypes.String,
                    });

                }

            }

        },

        number() {

            return {

                immutable() {

                    return new Component({
                        isTagType: false,
                        isReadonly: true,
                        name,
                        ctor: MagTypes.Number,
                    });

                },

                mutable() {

                    return new Component({
                        isTagType: false,
                        isReadonly: false,
                        name,
                        ctor: MagTypes.Number,
                    });

                }

            }
        
        },

        boolean() {

            return {

                immutable() {

                    return new Component({
                        isTagType: false,
                        isReadonly: true,
                        name,
                        ctor: MagTypes.Boolean,
                    });

                },

                mutable() {

                    return new Component({
                        isTagType: false,
                        isReadonly: false,
                        name,
                        ctor: MagTypes.Boolean,
                    });

                }

            }
        
        },

        tag() {

            return new Component({
                isTagType: true,
                isReadonly: true,
                name,
                ctor: MagTypes.Tag,
            });
        
        },

    }

}

export class ComponentQueryAccessor<
    Q extends Query,
    Cmps extends readonly Component[] = Q extends Query<infer Types> ? Types : never,
    Data extends readonly any[] = CmpDataTuple<Cmps>,
    List = ToArrays<Data>,
> {
    public query: Query;
    private dirty: boolean;
    public entities: number[];
    public components: List;

    public constructor(world: World, query: Query) {
        this.query = query;
        this.dirty = false;
        this.entities = world.getEntityIds(query);
        this.components = Component.getQueryComponentLists(this.query, this.entities);
    }
}

const strCmp = component("TestStr").string().immutable();
const booCmp = component("TestBoo").boolean().immutable();
const claCmp = component("TestClass").class(TestClass).immutable();
const testQuery = new Query().all(strCmp, booCmp, claCmp)

type TestQuery = ComponentQueryAccessor<typeof testQuery>['components'];

export type CmpDataTuple<T extends readonly Component[]> = {
    [K in keyof T]: T[K] extends Component<any, infer Data> ? Data : never;
}

export type ToArrays<L extends readonly any[]> = {
    [K in keyof L]: L[K][];
}