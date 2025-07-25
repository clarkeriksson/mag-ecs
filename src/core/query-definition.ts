// noinspection JSUnusedGlobalSymbols

import { ComponentType } from "./component";

import {Bitset} from "../util/bitset";
import {Component} from "./component";

/**
 * Specifies the types of entities iterated in a query-like operation.
 * @class
 */
export class QueryDefinition<T extends readonly ComponentType<any, string, any, any>[] = ComponentType<any, string, any, any>[]>
{
    private static readonly _flags: Record<Uppercase<string>, number> = {
        "STATIC": 0,
    };

    /**
     * Internal representation of {@link paramTypes}.
     * @private
     */
    private _paramTypes: ComponentType<any, string, any, any>[];

    /**
     * The types directly supplied into query callback functions for this {@link QueryDefinition}.
     * This corresponds to types provided to either {@link withAll} or {@link withOnly} (exclusive).
     */
    public get paramTypes(): ComponentType<any, string, any, any>[]
    {
        return this._paramTypes;
    }

    /**
     * Bitset representing what types a queried entity needs all of.
     * @private
     */
    private _withAll: Bitset;

    /**
     * Bitset representing what types a queried entity can have none of.
     * @private
     */
    private _withNone: Bitset;

    /**
     * Bitset representing what types a queried entity can have one of.
     * @private
     */
    private _withOne: Bitset;

    /**
     * Bitset representing what types a queried entity must have at least one of.
     * @private
     */
    private _withSome: Bitset;

    /**
     * Bitset representing what types a queried entity needs exactly all of.
     * @private
     */
    private _withOnly: Bitset;

    /**
     * Creates an instance of {@link QueryDefinition}.
     * @constructor
     */
    public constructor()
    {
        this._paramTypes = [];
        this._withAll = new Bitset();
        this._withNone = new Bitset();
        this._withOne = new Bitset();
        this._withSome = new Bitset();
        this._withOnly = new Bitset();
    }

    /**
     * Modifies the {@link QueryDefinition} to require all given types.
     * Should not be used with any other query modifying methods.
     * @param types
     */
    public withAll<T extends ComponentType<any, string, any, any>[]>(...types: T): QueryDefinition<T>
    {
        if (this._withOnly.setFlagCount !== 0) throw new Error("Attempted to apply a 'withAll' filter on a query " +
            "definition with a preexisting 'withOnly' filter.");

        this._paramTypes = types;
        this._withAll = Component.bitsetFromTypes(...types);
        return this as QueryDefinition<T>;
    }

    /**
     * Modifies the {@link QueryDefinition} to exclude all given types.
     * Should not be used with the {@link QueryDefinition.withOnly} method.
     * @param types
     */
    public withNone(...types: ComponentType<any, string, any, any>[]): QueryDefinition<T>
    {
        if (this._withOnly.setFlagCount !== 0) throw new Error("Attempted to apply a 'withNone' filter on a query " +
            "definition with a preexisting 'withOnly' filter.");

        this._withNone = Component.bitsetFromTypes(...types);
        return this;
    }

    /**
     * Modifies the {@link QueryDefinition} to require one of the given types exclusively.
     * Should not be used with the {@link QueryDefinition.withOnly} method.
     * @param types
     */
    public withOne(...types: ComponentType<any, string, any, any>[]): QueryDefinition<T>
    {
        if (this._withOnly.setFlagCount !== 0) throw new Error("Attempted to apply a 'withOne' filter on a query " +
            "definition with a preexisting 'withOnly' filter.");

        this._withOne = Component.bitsetFromTypes(...types);
        return this;
    }

    /**
     * Modifies the {@link QueryDefinition} to require all given types exclusively.
     * Should not be used with any other query modifying methods.
     * @param types
     */
    public withOnly<T extends ComponentType<any, string, any, any>[]>(...types: T): QueryDefinition<T>
    {
        if (this._withAll.setFlagCount !== 0 || this._withNone.setFlagCount !== 0) throw new Error("Attempted to" +
            " apply a " +
            "'withOnly' filter on a query definition with a preexisting 'withAll' or 'withNone' filter.");

        this._paramTypes = types;
        this._withOnly = Component.bitsetFromTypes(...types);
        return this as QueryDefinition<T>;
    }

    /**
     * Returns a boolean representing whether the given {@link Bitset} satisfies this {@link QueryDefinition}.
     * @param signature
     */
    public satisfiedBy(signature: Bitset): boolean
    {
        // With Only Check
        if (this._withOnly.setFlagCount !== 0) return signature.equals(this._withOnly);

        // With None Check
        if (this._withNone.overlaps(signature)) return false;

        // With One Check
        if (this._withOne.setFlagCount !== 0 && Bitset.and(this._withOne, signature).setFlagCount !== 1) return false;

        // With Some Check
        if (this._withSome.setFlagCount !== 0 && Bitset.and(this._withSome, signature).setFlagCount === 0) return false;

        // With All Check
        return signature.isSupersetOf(this._withAll);
    }
}