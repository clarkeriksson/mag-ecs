// noinspection JSUnusedGlobalSymbols
import {QueryDefinition} from "./query-definition";
import {Bitset} from "../util/bitset";
import {System} from "./system";
import {TimeContext} from "../util/time-context";

import {Component, QueryComponentInstanceTuple, StaticComponentType} from "./component";
import type { ComponentTypeInstance, ComponentType, Tupled, ComponentInstanceTuple, StaticComponentInstanceTuple, Constructor, Value } from "./component";
import {SparseTagSet} from "../util/sparse-tag-set";

/**
 * @class World
 * @summary A mag-ecs world. Informally represents what should be a (mostly) isolated ECS context.
 */
class World
{
    /**
     * Holds all {@link World} instances.
     * @private
     */
    private static readonly _statics: World[] = [];

    private readonly _bases: Record<string, number> = { "none": -1 };

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
    private readonly _entities: (Bitset | undefined)[];

    private readonly _inheritance: (number | undefined)[];

    private readonly _staticEntities: (Bitset | undefined)[];

    /**
     * Array of unused entity ids, for entity id recycling.
     * @private
     */
    private readonly _cemetery: number[];

    private readonly _staticCemetery: number[];

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

    private readonly _staticQueryCache: Map<QueryDefinition, number[]>;

    private readonly _staticQueryCacheDirty: Map<QueryDefinition, boolean>;

    /**
     * This {@link World}'s registered systems.
     * @private
     */
    private readonly _systems: System[];

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

        this._inheritance = [];

        this._staticEntities = [];
        this._staticCemetery = [];

        this._queryCache = new Map();
        this._queryCacheDirty = new Map();

        this._staticQueryCache = new Map();
        this._staticQueryCacheDirty = new Map();

        this._systems = [];

        World._statics.push(this);
    }

    /**
     * Update all active {@link World}(s).
     * @static
     */
    public static update(): void
    {
        TimeContext.onStart();

        for (const world of World._statics)
        {
            world.update();
        }

        TimeContext.onEnd();
    }

    /**
     * Update the {@link World}.
     */
    public update(): void
    {
        for (const [def, value] of this._queryCacheDirty.entries())
        {
            if (value) this.refreshQuery(def);
        }

        for (const system of this._systems)
        {
            system.run(this);
        }
    }

    /**
     * Gets the numeric id of the base entity registered to the given name.
     * @param name
     */
    public base(name: string): number
    {
        return this._bases[name] || -1;
    }

    /**
     * Registers a new {@link System} to this {@link World}.
     * @param system
     */
    public registerSystem(system: System): boolean
    {
        if (this._systems.includes(system)) return false;

        this._systems.push(system);
        this._systems.sort((a, b) => a.runIndex - b.runIndex);

        return true;
    }

    /**
     * Registers many new {@link System}(s) to this {@link World}.
     * Defers sorting to the end.
     * @param systems
     */
    public registerSystems(...systems: System[]): void
    {
        for (const system of systems)
        {
            if (this._systems.includes(system)) continue;

            this._systems.push(system);
        }

        this._systems.sort((a, b) => a.runIndex - b.runIndex);
    }

    /**
     * Creates an entity in this {@link World} with the given components.
     * @param from
     * @param components
     */
    public create(from: number, ...components: ComponentTypeInstance<ComponentType<Constructor | Value, string, false, boolean>>[]): number
    {
        let entity = this._cemetery.pop();
        if (entity === undefined)
        {
            entity = this._entities.length;
        }

        if (from !== -1)
        {
            this._inheritance[entity] = from;
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

    public createStatic(name: string, ...components: ComponentTypeInstance<ComponentType<Constructor | Value, string, true, boolean>>[]): number
    {
        let entity = this._staticCemetery.pop();
        if (entity === undefined)
        {
            entity = this._staticEntities.length;
        }

        if (this._bases[name] !== undefined) throw new Error('Attempted reassignment of a static base entity.');

        for (const component of components)
        {
            this.addComponentUnsafe(entity, component as ComponentTypeInstance<ComponentType<Constructor | Value, string, true, boolean>>);
        }

        const bitset = Component.bitsetFromComponents(...components);

        this.dirtyQueriesMatching(bitset);

        this._staticEntities[entity] = bitset;

        this._bases[name] = entity;

        return entity;
    }

    /**
     * Adds a component to an entity, adjusts the entity signature, and updates relevant queries.
     * @param entity
     * @param component
     */
    public addComponent<T extends Constructor | Value>(entity: number, component: ComponentTypeInstance<ComponentType<T, string, false, boolean>>): number
    {
        Component.set(entity, component);

        this.dirtyQueriesMatching(this._entities[entity] ?? Bitset.null);
        this._entities[entity]?.set(Component.T(component.type as ComponentType<T, string, boolean, boolean>).id, true);
        this.dirtyQueriesMatching(this._entities[entity] ?? Bitset.null);

        return entity;
    }

    public addStaticComponent<T extends Constructor | Value>(entity: number, component: ComponentTypeInstance<ComponentType<T, string, true, boolean>>): number
    {
        Component.set(entity, component);

        this.dirtyStaticQueriesMatching(this._staticEntities[entity] ?? Bitset.null);
        this._staticEntities[entity]?.set(Component.T(component.type as ComponentType<T, string, true, boolean>).id, true);
        this.dirtyStaticQueriesMatching(this._staticEntities[entity] ?? Bitset.null);

        return entity;
    }

    /**
     * Removes a component from an entity, adjusts the entity signature, and updates relevant queries.
     * @param entity
     * @param type
     */
    public removeComponent<T extends Constructor | Value>(entity: number, type: ComponentType<T, string, boolean, boolean>): boolean
    {
        const removed = Component.removeComponent(entity, type);

        this.dirtyQueriesMatching(this._entities[entity] ?? Bitset.null);
        this._entities[entity]?.set(Component.T(type).id, false);
        this.dirtyQueriesMatching(this._entities[entity] ?? Bitset.null);

        return removed !== null;
    }

    public removeStaticComponent<T extends Constructor | Value>(entity: number, type: ComponentType<T, string, false, boolean>): boolean
    {
        const removed = Component.removeComponent(entity, type);

        this.dirtyStaticQueriesMatching(this._staticEntities[entity] ?? Bitset.null);
        this._staticEntities[entity]?.set(Component.T(type).id, false);
        this.dirtyStaticQueriesMatching(this._staticEntities[entity] ?? Bitset.null);

        return removed !== null;
    }

    /**
     * Adds a component to an entity without performing side effects.
     * Dangerous, use with caution when you plan on manually performing side effects.
     * @param entity
     * @param component
     * @private
     */
    private addComponentUnsafe<T extends Constructor | Value, N extends string>(entity: number, component: ComponentTypeInstance<ComponentType<T, N, boolean, boolean>>): number
    {
        Component.set(entity, component);
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

        delete this._entities[entity];
        this._cemetery.push(entity);

        return removed;
    }

    /**
     * Gets components of the provided types from the given entity and returns them in a corresponding array.
     * @param types
     * @param entity
     */
    public get<T extends readonly ComponentType<Constructor | Value, string, boolean, boolean>[]>(types: Tupled<T>, entity: number): QueryComponentInstanceTuple<T>
    {
        const instanceSignature = Component.bitsetFromTypes(...types);
        const prototype = this._inheritance[entity];
        const staticSignature = (prototype === undefined) ? Bitset.null : this._staticEntities[prototype] ?? Bitset.null;

        const signature = Bitset.or(instanceSignature, staticSignature);

        if (!this._entities[entity]?.isSupersetOf(signature)) throw new Error();

        let result= new Array(types.length);
        for (let i = 0; i < types.length; i++)
        {
            const type = types[i];
            result[i] = Component.getUnchecked(instanceSignature.get(Component.T(type).id) ? entity : prototype!, type);
        }

        return result as QueryComponentInstanceTuple<T>;
    }

    public getStatic<T extends readonly ComponentType<Constructor | Value, string, boolean, boolean>[]>(types: Tupled<T>, entity: number): StaticComponentInstanceTuple<T>
    {
        const signature = Component.bitsetFromTypes(...types);
        if (!this._staticEntities[entity]?.isSupersetOf(signature)) throw new Error();

        let result= new Array(types.length);
        for (let i = 0; i < types.length; i++)
        {
            const type = types[i];
            result[i] = Component.getUnchecked(entity, type);
        }

        return result as StaticComponentInstanceTuple<T>;
    }

    public entityCount(def: QueryDefinition): number
    {
        let count = 0;
        this.query(def, () => { count++; });
        return count;
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

    private dirtyStaticQueriesMatching(signature: Bitset): void
    {
        for (const [cacheQuery, _] of this._staticQueryCacheDirty)
        {
            if (cacheQuery.satisfiedBy(signature))
            {
                this._staticQueryCacheDirty.set(cacheQuery, true);
            }
        }
    }

    /**
     * Updates the cache for the query with the given {@link QueryDefinition}.
     * @param queryDefinition
     * @private
     */
    private refreshQuery<T extends ComponentType<any, string, boolean, boolean>[]>(queryDefinition: QueryDefinition<T>): void
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

    private refreshStaticQuery<T extends ComponentType<any, string, boolean, boolean>[]>(queryDefinition: QueryDefinition<T>): void
    {
        const newQueryResult: number[] = [];
        this._staticQueryCache.set(queryDefinition, newQueryResult);

        for (let i = 0; i < this._staticEntities.length; i++)
        {
            const entitySignature = this._staticEntities[i] ?? Bitset.null;
            if (queryDefinition.satisfiedBy(entitySignature)) newQueryResult.push(i);
        }

        this._staticQueryCacheDirty.set(queryDefinition, false);
    }

    public staticQuery<T extends ComponentType<any, string, boolean, boolean>[]>(queryDef: QueryDefinition<T>, callback: (...components: StaticComponentInstanceTuple<T>) => void): void
    {
        if (this._staticQueryCacheDirty.get(queryDef) ?? true)
        {
            this.refreshStaticQuery(queryDef);
        }

        const entities = this._staticQueryCache.get(queryDef)!;

        for (const entity of entities)
        {
            const components = this.getStatic(queryDef.paramTypes, entity);
            callback(...components as StaticComponentInstanceTuple<T>)
        }
    }

    /**
     * Queries using the given {@link QueryDefinition} and maps the provided callback across queried components.
     * @param queryDefinition
     * @param callback
     */
    public query<T extends ComponentType<any, string, boolean, boolean>[]>(queryDefinition: QueryDefinition<T>, callback: (...components: QueryComponentInstanceTuple<T>) => void): void
    {
        if (this._queryCacheDirty.get(queryDefinition) ?? true)
        {
            this.refreshQuery(queryDefinition);
        }

        const entities = this._queryCache.get(queryDefinition)!;

        for (const entity of entities)
        {
            const components = this.get(queryDefinition.paramTypes, entity);
            callback(...components as QueryComponentInstanceTuple<T>);
        }
    }

    /**
     * Queries using the given {@link QueryDefinition} and maps the provided callback across queried entities and components.
     * @param queryDefinition
     * @param callback
     */
    public entityQuery<T extends ComponentType<any, string, boolean, boolean>[]>(queryDefinition: QueryDefinition<T>, callback: (entity: number, ...components: QueryComponentInstanceTuple<T>) => void): void
    {
        if (this._queryCache.get(queryDefinition) ?? true)
        {
            this.refreshQuery(queryDefinition);
        }

        const entities = this._queryCache.get(queryDefinition)!;

        for (const entity of entities)
        {
            const components = this.get(queryDefinition.paramTypes, entity);
            callback(entity, ...components as QueryComponentInstanceTuple<T>);
        }
    }

    public staticEntityQuery<T extends ComponentType<any, string, boolean, boolean>[]>(queryDef: QueryDefinition<T>, callback: (entity: number, ...components: StaticComponentInstanceTuple<T>) => void): void
    {
        if (this._staticQueryCache.get(queryDef) ?? true)
        {
            this.refreshStaticQuery(queryDef);
        }

        const entities = this._staticQueryCache.get(queryDef)!;

        for (const entity of entities)
        {
            const components = this.getStatic(queryDef.paramTypes, entity);
            callback(entity, ...components as StaticComponentInstanceTuple<T>);
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