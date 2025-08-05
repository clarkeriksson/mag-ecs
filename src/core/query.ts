// noinspection JSUnusedGlobalSymbols

import { ComponentType } from "./component.js";

import {Bitset} from "../util/bitset.js";
import {Component} from "./component.js";

/**
 * Specifies the types of entities iterated in a query-like operation.
 * @class
 */
export class Query<T extends readonly Component<any, string, any>[] = Component<any, string, any>[]>
{
    /**
     * Internal representation of {@link paramTypes}.
     * @private
     */
    private _paramTypes: Component<any, string, any>[];

    /**
     * The types directly supplied into query callback functions for this {@link Query}.
     * This corresponds to types provided to either {@link all} or {@link only} (exclusive).
     */
    public get paramTypes(): Component<any, string, any>[]
    {
        return this._paramTypes;
    }

    /**
     * Bitset representing what types a queried entity needs all of.
     * @private
     */
    private _all: Bitset;

    /**
     * Bitset representing what types a queried entity can have none of.
     * @private
     */
    private _none: Bitset;

    /**
     * Bitset representing what types a queried entity can have one of.
     * @private
     */
    private _one: Bitset;

    /**
     * Bitset representing what types a queried entity must have at least one of.
     * @private
     */
    private _some: Bitset;

    /**
     * Bitset representing what types a queried entity needs exactly all of.
     * @private
     */
    private _only: Bitset;

    /**
     * Creates an instance of {@link Query}.
     * @constructor
     */
    public constructor()
    {
        this._paramTypes = [];
        this._all = new Bitset();
        this._none = new Bitset();
        this._one = new Bitset();
        this._some = new Bitset();
        this._only = new Bitset();
    }

    /**
     * Modifies the {@link Query} to require all given types.
     * Should not be used with any other query modifying methods.
     * @param types The types.
     */
    public all<T extends Component<any, string, any>[]>(...types: T): Query<T>
    {
        if (this._only.setFlagCount !== 0) throw new Error("Attempted to apply a 'withAll' filter on a query " +
            "definition with a preexisting 'withOnly' filter.");

        this._paramTypes = types;
        this._all = Component.bitsetFromTypes(...types);
        return this as Query<T>;
    }

    /**
     * Modifies the {@link Query} to exclude all given types.
     * Should not be used with the {@link Query.only} method.
     * @param types The types.
     */
    public none(...types: Component<any, string, any>[]): Query<T>
    {
        if (this._only.setFlagCount !== 0) throw new Error("Attempted to apply a 'withNone' filter on a query " +
            "definition with a preexisting 'withOnly' filter.");

        this._none = Component.bitsetFromTypes(...types);
        return this;
    }

    /**
     * Modifies the {@link Query} to require one of the given types exclusively.
     * Should not be used with the {@link Query.only} method.
     * @param types The types.
     */
    public one(...types: Component<any, string, any>[]): Query<T>
    {
        if (this._only.setFlagCount !== 0) throw new Error("Attempted to apply a 'withOne' filter on a query " +
            "definition with a preexisting 'withOnly' filter.");

        this._one = Component.bitsetFromTypes(...types);
        return this;
    }

    /**
     * Modifies the {@link Query} to require at least one of the given types.
     * @param types The types.
     */
    public some(...types: Component<any, string, any>[]): Query<T>
    {
        this._some = Component.bitsetFromTypes(...types);
        return this;
    }

    /**
     * Modifies the {@link Query} to require all given types exclusively.
     * Should not be used with any other query modifying methods.
     * @param types The types.
     */
    public only<T extends Component<any, string, any>[]>(...types: T): Query<T>
    {
        if (this._all.setFlagCount !== 0 || this._none.setFlagCount !== 0) throw new Error("Attempted to" +
            " apply a " +
            "'withOnly' filter on a query definition with a preexisting 'withAll' or 'withNone' filter.");

        this._paramTypes = types;
        this._only = Component.bitsetFromTypes(...types);
        return this as Query<T>;
    }

    /**
     * Returns a boolean representing whether the given {@link Bitset} satisfies this {@link Query}.
     * @param signature The {@link Bitset} to check.
     */
    public satisfiedBy(signature: Bitset): boolean
    {
        // With Only Check
        if (this._only.setFlagCount !== 0) return signature.equals(this._only);

        // With None Check
        if (this._none.overlaps(signature)) return false;

        // With One Check
        const withOneAnd = Bitset.and(this._one, signature);
        if (this._one.setFlagCount !== 0 && withOneAnd.setFlagCount !== 1)
        {
            Bitset.return(withOneAnd);
            return false;
        }

        // With Some Check
        const withSomeAnd = Bitset.and(this._some, signature);
        if (this._some.setFlagCount !== 0 && withSomeAnd.setFlagCount === 0)
        {
            Bitset.return(withSomeAnd);
            return false;
        }

        // With All Check
        return signature.isSupersetOf(this._all);
    }
}