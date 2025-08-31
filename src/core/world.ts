// noinspection JSUnusedGlobalSymbols
import {Bitset} from "../util/bitset.js";
import {Query} from "./query.js";
import {Component, Accessor, ComponentAccessorTuple, DataType, Constructor, Value, component} from "./component.js";

/**
 * @class World
 * @summary A mag-ecs world. Informally represents what should be a (mostly) isolated ECS context.
 */
class World {

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
     * Array of entities represented as their component signature {@link Bitset}.
     * @private
     */
    private readonly _entities: (Bitset | undefined)[];

    /**
     * Array of indices of unused entity ids, for reuse.
     * @private
     */
    private readonly _entityCemetery: number[];

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
    private readonly _accessorCache: Map<Query, Accessor[]>;

    /**
     * Creates an instance of {@link World}.
     * @constructor
     */
    public constructor() {

        this.id = World._nextId;
        World._nextId++;

        const INITIAL_SIZE = 1024;

        this._entities = new Array(INITIAL_SIZE);
        this._entities.fill(undefined, 0, this._entities.length);

        this._entityCemetery = new Array(INITIAL_SIZE);
        for (let i = 0; i < INITIAL_SIZE; i++) {
            this._entityCemetery[i] = INITIAL_SIZE - (i + 1);
        }

        this._queryCache = new Map();
        this._dirtyQueries = new Set();

        this._accessorCache = new Map();

    }

    public create(): number {

        let recycled = this._entityCemetery.pop() ?? this._entities.length;

        this._entities[recycled] = new Bitset();

        return recycled;

    }

    public add<Type extends Constructor | Value, Readonly extends true | false>(entity: number, type: Component<Type, string, Readonly>, value: DataType<Type, Readonly>) {

        type.add(entity, value);

        const bitset = this._entities[entity];

        if (bitset === undefined) return;

        bitset.set(type.id, true);

    }

    public run<T extends readonly Component<any, any, any>[]>(query: Query<T>, callback: (entity: number, types: ComponentAccessorTuple<T>) => void) {

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

            callback(entity, cachedAccessors as ComponentAccessorTuple<T>);

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

}

export { World };

// const world = new World();
// const classCmp = component("classCmp").class(class ClassCmp { public num: number = 0; }).immutable();
// const cmp = component("cmp").value<number>().immutable();
// const query = new Query().all(cmp, classCmp);
// world.run(query, function(entity, [acc, cla]) {
//
// });