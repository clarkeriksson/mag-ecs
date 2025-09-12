// noinspection JSUnusedGlobalSymbols
import { MagTypes, type CtorReadData, type CtorData, MagDataClassCtor, JSONValue } from "../globals.js";

import {Bitset} from "../util/bitset.js";
import {Query} from "./query.js";
import {Component, Accessor, CmpAccTuple, component} from "./component.js";

/**
 * @class World
 * @summary A mag-ecs world. Informally represents what should be a (mostly) isolated ECS context.
 */
class World {

    /**
     * Static value representing the initialization size of the {@link World} in terms of entity count.
     */
    private static INITIAL_SIZE: number = 1024;

    /**
     * Static incrementing value used for {@link World} ids.
     * @private
     */
    private static _nextId: number = 0;

    /**
     * The {@link World} id.
     */
    public readonly id: number;

    /**
     * Array of entities represented as their component signature {@link Bitset}. Represents both
     * inherited and uninherited components.
     * @private
     */
    private readonly _entities: (Bitset | undefined)[];

    /**
     * Array of indices of unused entity ids, for reuse.
     * @private
     */
    private _entityCemetery: number[];

    /**
     * Array of entity instance {@link Bitset Bitsets}, representing uninherited components exclusively.
     */
    private readonly _instances: (Bitset | undefined)[];

    /**
     * Array of entity prototypes represented as their component signature {@link Bitset}.
     * @private
     */
    private readonly _prototypes: Bitset[];

    /**
     * Array of indices into the {@link _prototypes prototypes} array that describe the inheritance of
     * the entity associated with the searched index in this array.
     * @private
     */
    private readonly _inheritance: (number | undefined)[];

    /**
     * Cached query results.
     * @private
     */
    private readonly _queryCache: Map<Query, number[]>;

    /**
     * Set of queries needing updates.
     * @private
     */
    private readonly _dirtyQueries: Set<Query>;

    /**
     * Cache of {@link Accessor} instances for existing {@link Query} instances.
     */
    private readonly _accessorCache: Map<Query, Accessor<any, any, any, any, any, any>[]>;

    /**
     * Creates an instance of {@link World}.
     * @constructor
     */
    public constructor() {

        this.id = World._nextId;
        World._nextId++;

        this._entities = new Array(World.INITIAL_SIZE);
        this._entities.fill(undefined, 0, this._entities.length);

        this._entityCemetery = new Array(World.INITIAL_SIZE);
        for (let i = 0; i < World.INITIAL_SIZE; i++) {
            this._entityCemetery[i] = World.INITIAL_SIZE - (i + 1);
        }

        this._instances = new Array(World.INITIAL_SIZE);
        this._instances.fill(undefined, 0, this._instances.length);

        this._prototypes = [];

        this._inheritance = new Array(World.INITIAL_SIZE);
        this._inheritance.fill(undefined, 0, this._inheritance.length);

        this._queryCache = new Map();
        this._dirtyQueries = new Set();

        this._accessorCache = new Map();

    }

    public create(): number {

        let recycled = this._entityCemetery.pop() ?? this._entities.length;

        this._entities[recycled] = new Bitset();

        return recycled;

    }

    public add<
        Inst,
        Data,
        Json extends JSONValue,
        Type extends MagDataClassCtor<Inst, Json, Data>,
        Name extends string,
        Read extends boolean,
    >(entity: number, type: Component<Inst, Data, Json, Type, Name, Read, false>, value: CtorData<Type>) {

        type.add(entity, value);

        const bitset = this._entities[entity];

        if (bitset === undefined) return;

        bitset.set(type.id, true);

    }

    public run<T extends readonly Component[]>(query: Query<T>, callback: (entity: number, types: CmpAccTuple<T>) => void) {

        this._ensureFresh(query);

        const types = query.paramTypes;
        const typesLength = types.length;

        const queriedEntities = this._queryCache.get(query)!;
        const queryComponents = Component.getQueryComponents(queriedEntities, types);

        let cachedAccessors = this._accessorCache.get(query);

        if (cachedAccessors === undefined) {

            cachedAccessors = new Array(typesLength);
            for (let i = 0; i < cachedAccessors.length; i++) {

                cachedAccessors[i] = new Accessor();
                cachedAccessors[i].component = types[i];

            }

        }

        for (let i = 0; i < queriedEntities.length; i++) {

            const entity = queriedEntities[i];
            const baseIndex = i * typesLength;

            for (let j = 0; j < typesLength; j++) {

                const accessor = cachedAccessors[j];

                accessor.entity = entity;
                (accessor.data as any) = queryComponents[baseIndex + j];

            }

            callback(entity, cachedAccessors as CmpAccTuple<T>);

        }

    }

    private _ensureCache(query: Query): number[] {

        if (this._queryCache.has(query)) {

            return this._queryCache.get(query)!;

        }

        const newQuery: number[] = [];

        this._queryCache.set(query, newQuery);
        this._dirtyQueries.add(query);

        return newQuery;

    }

    private _ensureFresh(query: Query): void {

        this._ensureCache(query);

        if (this._dirtyQueries.has(query)) {

            this._refreshQuery(query);
            this._dirtyQueries.delete(query);
            return;

        }

    }

    private _refreshQuery(query: Query): void {

        const entities = this._ensureCache(query);

        const newSet = new Set<number>(entities);

        for (let i = 0; i < this._entities.length; i++) {

            const signature = this._entities[i];

            if (signature === undefined) {

                newSet.delete(i);
                continue;

            }

            const matches = query.satisfiedBy(signature);

            if (matches) {

                newSet.add(i);

            }

        }

        this._queryCache.set(query, Array.from(newSet));
        this._dirtyQueries.delete(query);

    }

    public getEntityIds(query: Query): number[] {

        const result = [];

        for (let i = 0; i < this._entities.length; i++) {

            const signature = this._entities[i];

            if (signature === undefined) {

                continue;

            }

            const matches = query.satisfiedBy(signature);

            if (matches) {

                result.push(i);

            }

        }

        return result;

    }

    public toJSON(): {
        entities: { entity: number, bitset: Bitset }[],
        entityCemetery: number[],
    } {

        const result: {
            entities: { entity: number, bitset: Bitset }[],
            entityCemetery: number[],
        } = {
            entities: [],
            entityCemetery: [],
        };

        for (let i = 0; i < this._entities.length; i++) {
            const bitset = this._entities[i];
            if (bitset !== undefined) {
                result.entities.push({
                    entity: i,
                    bitset: bitset,
                });
            }
        }

        result.entityCemetery = this._entityCemetery;

        return result;

    }

    public static fromJSON(json: {
        entities: { entity: number, bitset: Bitset }[],
        entityCemetery: number[],
    }) {

        const result = new World();
        
        for (let i = 0; i < json.entities.length; i++) {
            const { entity, bitset } = json.entities[i];
            result._entities[entity] = bitset;
        }

        result._entityCemetery = json.entityCemetery;

        return result;

    }

}

export { World };

// type TestDataClassJson = {
//     num: number;
//     str: string;
//     bool: boolean;
//     obj: { prop: number };
//     name: "Test";
// }
// class TestDataClass {

//     public num: number;
//     public str: string;
//     public bool: boolean;
//     public obj: { prop: number };

//     public constructor(num?: number, str?: string, bool?: boolean, obj?: { prop: number }) {
//         this.num = num ?? (10 * Math.random())|0;
//         this.str = str ?? ("String " + ((10 * Math.random())|0));
//         this.bool = bool ?? (Math.random() > 0.5);
//         this.obj = obj ?? { prop: Math.random() };
//     }

//     static toJSON(value: TestDataClass): TestDataClassJson {
//         return {
//             num: value.num,
//             str: value.str,
//             bool: value.bool,
//             obj: value.obj,
//             name: "Test",
//         }
//     }

//     static fromJSON(json: TestDataClassJson): TestDataClass {
//         return new TestDataClass(json.num, json.str, json.bool, json.obj);
//     }

// }

// const TestDataCmp = component("TestDataCmp").class(TestDataClass).mutable();
// const TestStrCmp = component("TestStrCmp").string().immutable();

// const testWorld = new World();

// const newEntity = testWorld.create();
// testWorld.add(newEntity, TestDataCmp, new TestDataClass());
// testWorld.add(newEntity, TestStrCmp, "Hello");

// const testQuery = new Query().all(TestDataCmp, TestStrCmp);

// testWorld.run(testQuery, (entity, [data, str]) => {
//     data.mutate(val => {
//         val.num += 1;
//     });
// });