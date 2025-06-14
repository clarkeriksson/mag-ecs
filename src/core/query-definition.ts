import {Bitset} from "../util/bitset";
import {ClassConstructor, ConstructorsOf, Component} from "./component";

export class QueryDefinition<T extends any[] = any[]>
{
    public paramTypes: ClassConstructor[];

    private _withAll: Bitset;

    private _withNone: Bitset;

    private _withAny: Bitset;

    private _withOnly: (Bitset | null);

    public constructor()
    {
        this.paramTypes = [];
        this._withAll = new Bitset();
        this._withNone = new Bitset();
        this._withAny = new Bitset();
        this._withOnly = null;
    }

    public withAll<TClasses extends any[]>(...types: ConstructorsOf<TClasses>): QueryDefinition<TClasses>
    {
        this.paramTypes = types;
        this._withAll = Component.bitsetFromTypes(...types);
        return this as QueryDefinition<TClasses>;
    }

    public withNone(...types: ClassConstructor[]): QueryDefinition<T>
    {
        this._withNone = Component.bitsetFromTypes(...types);
        return this;
    }

    public satisfiedBy(signature: Bitset): boolean
    {
        // With Only Check
        if (this._withOnly !== null) return signature.equals(this._withOnly);

        // With None Check
        const withNoneMatch = signature.isSupersetOf(this._withNone);
        if (withNoneMatch) return false;

        // With All Check
        const withAllCheck = signature.isSupersetOf(this._withAll);

        // With Any Check
        const withAnyCheck = signature.isSubsetOf(this._withAny);

        return withAllCheck && withAnyCheck;
    }
}