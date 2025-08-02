// noinspection JSUnusedGlobalSymbols
import { QueryDefinition } from "./query-definition.js";
import { Bitset } from "../util/bitset.js";
import { System } from "./system.js";
import { TimeContext } from "../util/time-context.js";
import { Component } from "./component.js";
import { ArrayPool } from "../util/array-pool.js";

import type {
    ComponentTypeInstance,
    ComponentType,
    Tupled,
    StaticComponentInstanceTuple,
    QueryComponentInstanceTuple,
    Constructor,
    Value
} from "./component.js";

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

    /**
     * Maps strings to static entity ids.
     * @private
     */
    private readonly _baseNameToId: Record<string, number> = { "none": -1 };

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
     * Array of entity {@link Bitset}(s), where index corresponds to entity id.
     * @private
     */
    private readonly _entities: (Bitset | undefined)[];

    private readonly _compoundEntities: (Bitset | undefined)[];

    /**
     * Array of static entity inheritance ids, where index corresponds to non-static entity id.
     * @private
     */
    private readonly _inheritance: (number | undefined)[];

    public getInheritance(entity: number): number | undefined
    {
        return this._inheritance[entity];
    }

    /**
     * Array of static entity {@link Bitset}(s), where index corresponds to static entity id.
     * @private
     */
    private readonly _staticEntities: (Bitset | undefined)[];

    /**
     * Array of unused entity ids, for entity id recycling.
     * @private
     */
    private readonly _cemetery: number[];

    /**
     * Array of unused static entity ids, for static entity id recycling.
     * @private
     */
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

    /**
     * Cache containing lists of static entity ids corresponding to previously used {@link QueryDefinition}(s).
     * @private
     */
    private readonly _staticQueryCache: Map<QueryDefinition, number[]>;

    /**
     * Map translating previously used static {@link QueryDefinition}(s) to a bool representing if their cache is
     * dirty.
     * @private
     */
    private readonly _staticQueryCacheDirty: Map<QueryDefinition, boolean>;

    /**
     * This {@link World}'s registered {@link System}(s) in execution order.
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

        this._compoundEntities = [];

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
        if (this._baseNameToId[name] >= 0)
        {
            return this._baseNameToId[name];
        }
        return -1;
    }

    public getSignature(entity: number): Bitset
    {
        if (this._compoundEntities[entity] !== undefined) return this._compoundEntities[entity];
        throw new Error(`Cannot get signature for ${this._compoundEntities[entity]}`);
    }

    public updateSignature(entity: number): Bitset
    {
        if (this._compoundEntities[entity] === undefined) throw new Error("Compound entity isn't defined.");

        Bitset.return(this._compoundEntities[entity]);

        const instanceSignature = this._entities[entity] ?? Bitset.null;
        const prototype = this._inheritance[entity];
        const staticSignature = (prototype === undefined) ? Bitset.null : this._staticEntities[prototype]!;

        const result = Bitset.or(instanceSignature, staticSignature);
        this._compoundEntities[entity] = result;

        return result;
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
    public create(from: number, ...components: ComponentTypeInstance<ComponentType<Constructor | Value, string, false, true | false>>[]): number
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

        const instanceSignature = Component.bitsetFromComponents(...components);
        const prototype = this._inheritance[entity];
        const staticSignature = (prototype === undefined) ? Bitset.null : this._staticEntities[prototype] ?? Bitset.null;

        const bitset = Bitset.or(instanceSignature, staticSignature);

        //console.log(bitset.toString());

        this.dirtyQueriesMatching(bitset);

        this._entities[entity] = instanceSignature;
        this._compoundEntities[entity] = bitset;

        return entity;
    }

    public createStatic(name: string, ...components: ComponentTypeInstance<ComponentType<Constructor | Value, string, true, boolean>>[]): number
    {
        let entity = this._staticCemetery.pop();
        if (entity === undefined)
        {
            entity = this._staticEntities.length;
        }

        if (this._baseNameToId[name] !== undefined) throw new Error('Attempted reassignment of a static base entity.');

        for (const component of components)
        {
            this.addComponentUnsafe(entity, component as ComponentTypeInstance<ComponentType<Constructor | Value, string, true, boolean>>);
        }

        const bitset = Component.bitsetFromComponents(...components);

        this.dirtyStaticQueriesMatching(bitset);

        this._staticEntities[entity] = bitset;

        this._baseNameToId[name] = entity;

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

        this.dirtyQueriesMatching(this._compoundEntities[entity] ?? Bitset.null);
        this._entities[entity]?.set(Component.T(component.type as ComponentType<T, string, boolean, boolean>).id, true);
        this.updateSignature(entity);
        this.dirtyQueriesMatching(this._compoundEntities[entity] ?? Bitset.null);

        return entity;
    }

    public addStaticComponent<T extends Constructor | Value>(entity: number, component: ComponentTypeInstance<ComponentType<T, string, true, boolean>>): number
    {
        Component.set(entity, component);

        this.dirtyStaticQueriesMatching(this._staticEntities[entity] ?? Bitset.null);
        this._staticEntities[entity]?.set(Component.T(component.type as ComponentType<T, string, true, boolean>).id, true);
        this.dirtyStaticQueriesMatching(this._staticEntities[entity] ?? Bitset.null);

        for (let i = 0; i < this._inheritance.length; i++)
        {
            if (this._inheritance[i] === entity)
            {
                this.updateSignature(entity);
            }
        }

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

        this.dirtyQueriesMatching(this._compoundEntities[entity] ?? Bitset.null);
        this._entities[entity]?.set(Component.T(type).id, false);
        this.updateSignature(entity);
        this.dirtyQueriesMatching(this._compoundEntities[entity] ?? Bitset.null);

        return removed !== null;
    }

    public removeStaticComponent<T extends Constructor | Value>(entity: number, type: ComponentType<T, string, false, boolean>): boolean
    {
        const removed = Component.removeComponent(entity, type);

        this.dirtyStaticQueriesMatching(this._staticEntities[entity] ?? Bitset.null);
        this._staticEntities[entity]?.set(Component.T(type).id, false);
        this.dirtyStaticQueriesMatching(this._staticEntities[entity] ?? Bitset.null);

        for (let i = 0; i < this._inheritance.length; i++)
        {
            if (this._inheritance[i] === entity)
            {
                this.updateSignature(entity);
            }
        }

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
        const typesSignature = Component.bitsetFromTypes(...types);
        const prototype = this._inheritance[entity];

        let result = ArrayPool.rent(types.length);
        for (let i = 0; i < types.length; i++)
        {
            const type = types[i];
            result[i] = Component.getUnchecked(this._entities[entity]?.get(Component.T(type).id) ? entity : prototype!, type);
        }

        Bitset.return(typesSignature);
        return result as QueryComponentInstanceTuple<T>;
    }

    public getStatic<T extends readonly ComponentType<Constructor | Value, string, boolean, boolean>[]>(types: Tupled<T>, entity: number): StaticComponentInstanceTuple<T>
    {
        const signature = Component.bitsetFromTypes(...types);

        let result= new Array(types.length);
        for (let i = 0; i < types.length; i++)
        {
            const type = types[i];
            result[i] = Component.getUnchecked(entity, type);
        }

        Bitset.return(signature);
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

    private dirtyEntity(entity: number): void
    {

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
            const entitySignature = this._compoundEntities[i]!;

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
            try
            {
                callback(...components as StaticComponentInstanceTuple<T>)
            }
            finally
            {
                ArrayPool.return(components);
            }
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
        const allComponents = Component.getManyUnchecked(this, entities, queryDefinition.paramTypes);

        //console.log(allComponents[0]);

        const typesLength = queryDefinition.paramTypes.length;

        const currentComponents = ArrayPool.rent(typesLength);

        for (let i = 0; i < entities.length; i++)
        {
            for (let j = 0; j < typesLength; j++)
            {
                currentComponents[j] = allComponents[i * typesLength + j];
            }
            //console.log(currentComponents);
            callback(...currentComponents as QueryComponentInstanceTuple<T>);
        }

        ArrayPool.return(allComponents);
        ArrayPool.return(currentComponents);
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
            try
            {
                callback(entity, ...components as QueryComponentInstanceTuple<T>);
            }
            finally
            {
                ArrayPool.return(components);
            }
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
            try
            {
                callback(entity, ...components as StaticComponentInstanceTuple<T>);
            }
            finally
            {
                ArrayPool.return(components);
            }
        }
    }
}

export { World };