// noinspection JSUnusedGlobalSymbols

import {Component} from "./component";
import {QueryDefinition} from "./query-definition";
import {Bitset} from "../util/bitset";

/**
 * @class World
 * @summary A mag-ecs world. Informally represents what should be a (mostly) isolated ECS context.
 */
class World
{
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
     * Array of entity {@link Bitset}(s), where index corresponds to entity id. Empty spots are null.
     * @private
     */
    private readonly _entities: (Bitset | null)[];

    /**
     * Array of unused entity ids, for entity id recycling.
     * @private
     */
    private readonly _cemetery: number[];

    /**
     * Cache containing lists of entity ids corresponding to previously used {@link QueryDefinition}(s).
     * @private
     */
    private readonly _queryCache: Map<QueryDefinition, number[]>;

    /**
     * Map translating previously used {@link QueryDefinition}(s) to a bool representing if their cache is dirty.
     * @private
     */
    private readonly _queryCacheDirty: Map<QueryDefinition, boolean>;

    /**
     * Creates an instance of {@link World}.
     * @constructor
     */
    public constructor()
    {
        this.id = World._nextId;
        World._nextId++;

        this._entities = [];
        this._cemetery = [];

        this._queryCache = new Map();
        this._queryCacheDirty = new Map();
    }

    // noinspection JSUnusedLocalSymbols
    /**
     * Update the world.
     * @param dt
     */
    public update(dt: number): void
    {
        for (const [def, value] of this._queryCacheDirty.entries())
        {
            if (value) this.refreshQuery(def);
        }
    }

    /**
     * Creates an entity in this {@link World} with the given components.
     * @param components
     */
    public create(...components: TaggedComponent[]): number
    {
        let entity = this._cemetery.pop();
        if (entity === undefined)
        {
            entity = this._entities.length;
        }

        for (const component of components)
        {
            this.addComponentUnsafe(entity, component);
        }

        const bitset = Component.bitsetFromComponents(...components);

        this.dirtyQueriesMatching(bitset)

        this._entities[entity] = bitset;

        return entity;
    }

    /**
     * Adds a component to an entity, adjusts the entity signature, and updates relevant queries.
     * @param entity
     * @param value
     * @param type
     */
    public addComponent<T>(entity: number, { value, type }: TaggedComponent<T>): number
    {
        Component.set(entity, value, type);

        this.dirtyQueriesMatching(this._entities[entity] ?? Bitset.null);
        this._entities[entity]?.set(Component.T(type).id, true);
        this.dirtyQueriesMatching(this._entities[entity] ?? Bitset.null);

        return entity;
    }

    /**
     * Removes a component from an entity, adjusts the entity signature, and updates relevant queries.
     * @param entity
     * @param type
     */
    public removeComponent<T>(entity: number, type: ComponentType<T>): boolean
    {
        const removed = Component.removeComponent(entity, type);

        this.dirtyQueriesMatching(this._entities[entity] ?? Bitset.null);
        this._entities[entity]?.set(Component.T(type).id, false);
        this.dirtyQueriesMatching(this._entities[entity] ?? Bitset.null);

        return removed !== null;
    }

    /**
     * Adds a component to an entity without performing side effects.
     * Dangerous, use with caution when you plan on manually performing side effects.
     * @param entity
     * @param value
     * @param type
     * @private
     */
    private addComponentUnsafe<T>(entity: number, { value, type }: TaggedComponent<T>): number
    {
        Component.set(entity, value, type);
        return entity;
    }

    /**
     * Removes the given entity from this {@link World}.
     * @param entity
     */
    public remove(entity: number): boolean
    {
        this.dirtyQueriesMatching(this._entities[entity] ?? Bitset.null);

        const removed = Component.removeAll(entity);

        this._entities[entity] = null;
        this._cemetery.push(entity);

        return removed;
    }

    /**
     * Gets components of the provided types from the given entity and returns them in a corresponding array.
     * @param types
     * @param entity
     */
    public get<T extends ComponentType[]>(types: T, entity: number): ComponentTuple<T>
    {
        const signature = Component.bitsetFromTypes(...types);
        if (!this._entities[entity]?.isSupersetOf(signature)) throw new Error();

        let result= [] as unknown as ComponentTuple<T>;
        for (const type of types)
        {
            result.push(Component.getUnchecked(entity, type))
        }

        return result;
    }

    /**
     * Dirties the cached queries with {@link QueryDefinition}(s) matching the given {@link Bitset}.
     * @param signature
     * @private
     */
    private dirtyQueriesMatching(signature: Bitset): void
    {
        for (const [cacheQuery, _] of this._queryCacheDirty)
        {
            if (cacheQuery.satisfiedBy(signature))
            {
                this._queryCacheDirty.set(cacheQuery, true);
            }
        }
    }

    /**
     * Updates the cache for the query with the given {@link QueryDefinition}.
     * @param queryDefinition
     * @private
     */
    private refreshQuery<T extends ComponentType[]>(queryDefinition: QueryDefinition<T>): void
    {
        const newQueryResult: number[] = [];
        this._queryCache.set(queryDefinition, newQueryResult);

        for (let i = 0; i < this._entities.length; i++)
        {
            const entitySignature = this._entities[i] ?? Bitset.null;
            if (queryDefinition.satisfiedBy(entitySignature)) newQueryResult.push(i);
        }

        this._queryCacheDirty.set(queryDefinition, false);
    }

    /**
     * Queries using the given {@link QueryDefinition} and maps the provided callback across queried components.
     * @param queryDefinition
     * @param callback
     */
    public query<T extends ComponentType[]>(queryDefinition: QueryDefinition<T>, callback: (...components: ComponentTuple<T>) => void): void
    {
        if (this._queryCacheDirty.get(queryDefinition) ?? true)
        {
            this.refreshQuery(queryDefinition);
        }

        const entities = this._queryCache.get(queryDefinition)!;

        for (const entity of entities)
        {
            const components = this.get(queryDefinition.paramTypes, entity);
            callback(...components as ComponentTuple<T>);
        }
    }

    /**
     * Queries using the given {@link QueryDefinition} and maps the provided callback across queried entities and components.
     * @param queryDefinition
     * @param callback
     */
    public entityQuery<T extends ComponentType[]>(queryDefinition: QueryDefinition<T>, callback: (entity: number, ...components: ComponentTuple<T>) => void): void
    {
        if (this._queryCache.get(queryDefinition) ?? true)
        {
            this.refreshQuery(queryDefinition);
        }

        const entities = this._queryCache.get(queryDefinition)!;

        for (const entity of entities)
        {
            const components = this.get(queryDefinition.paramTypes, entity);
            callback(entity, ...components as ComponentTuple<T>);
        }
    }
}

export { World };

/*
const test = new World();

const Type1 = Component.register<string>("Type1");
class Test2 {test2 = true;}
const Type2 = Component.register<Test2>("Type2");
class Test3 {test3 = true;}
const Type3 = Component.register<Test3>("Type3");

const Type4 = Component.register<number>("Type4");

const def = new QueryDefinition()
    .withAll(Type1, Type3, Type4)
    .withNone(Type2);

test.query(def, (t1, t3, t4) => {});
*/