import {ClassConstructor, ConstructorsOf, Component} from "./component";
import {QueryDefinition} from "./query-definition";
import {Bitset} from "../util/bitset";

type QueryCallback<T extends ClassConstructor[]> = { [K in keyof T]: InstanceType<T[K]> };

/**
 * @class World
 * @summary A mag-ecs world.
 */
class World
{
    private static _nextId: number = 0;

    public readonly _id: number;

    private readonly _entities: (Bitset | null)[];

    private readonly _cemetery: number[];

    private readonly _queryCache: Map<QueryDefinition<any[]>, number[]>;
    private readonly _queryCacheDirty: Map<QueryDefinition<any[]>, boolean>;

    public constructor()
    {
        this._id = World._nextId;
        World._nextId++;

        this._entities = [];
        this._cemetery = [];

        this._queryCache = new Map();
        this._queryCacheDirty = new Map();
    }

    public create(...components: any[]): number
    {
        let entity = this._cemetery.pop();
        if (entity === undefined)
        {
            entity = this._entities.length;
        }

        for (const component of components)
        {
            Component.set(entity, component);
        }

        this.dirtyQueriesFor(Component.bitsetFromComponents(components))

        return entity;
    }

    public remove(entity: number): boolean
    {
        this.dirtyQueriesFor(this._entities[entity] ?? Bitset.null);

        const removed = Component.remove(entity);

        this._entities[entity] = null;
        this._cemetery.push(entity);

        return removed;
    }

    public get<T extends any[]>(types: T, entity: number): T
    {
        const signature = Component.bitsetFromTypes(...types);
        if (!this._entities[entity]?.isSupersetOf(signature)) throw new Error();

        let result= [] as unknown as T;
        for (const type of types)
        {
            result.push(Component.getUnchecked(entity, type))
        }

        return result;
    }

    private dirtyQueriesFor(signature: Bitset): void
    {
        for (const [cacheQuery, _] of this._queryCacheDirty)
        {
            if (cacheQuery.satisfiedBy(signature))
            {
                this._queryCacheDirty.set(cacheQuery, true);
            }
        }
    }

    private refreshQuery<T extends any[]>(queryDefinition: QueryDefinition<T>): void
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

    public query<T extends any[]>(queryDefinition: QueryDefinition<T>, callback: (...components: T) => void): void
    {
        if (this._queryCacheDirty.get(queryDefinition) ?? true)
        {
            this.refreshQuery(queryDefinition);
        }

        const entities = this._queryCache.get(queryDefinition)!;

        for (const entity of entities)
        {
            const components = this.get(queryDefinition.paramTypes, entity);
            callback(...components as T);
        }
    }
}

class Position {position = true;}
class Velocity {velocity = true;}
class Acceleration {acceleration = true;}
class Force {force = true;}
class Mass {mass = true;}

const world = new World();

const query = new QueryDefinition()
    .withAll(Position, Velocity, Acceleration)
    .withNone(Mass);

world.query(query, function (position: Position, force: Velocity, acc: Acceleration) {
    console.log(position);
    console.log(force);
    console.log(acc);
});