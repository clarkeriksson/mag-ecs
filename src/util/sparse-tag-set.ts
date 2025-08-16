import type { ISparseSet } from "./sparse-set.js";

/**
 * A "sparse set" containing entries of the type true. Not truly a sparse set, but designated as such to keep
 * uniformity with the other component storage "sparse set" classes.
 * @class
 */
export class SparseTagSet implements ISparseSet<true>
{
    private _sparse: Set<number>;

    public constructor()
    {
        this._sparse = new Set<number>();
    }

    public add(index: number): boolean
    {
        if (this._sparse.has(index)) return false;

        this._sparse.add(index);
        return true;
    }

    public remove(index: number): true | undefined
    {
        const removed = this._sparse.delete(index);
        return removed || undefined;
    }

    public set(index: number, value: true)
    {
        if (this._sparse.has(index)) return false;
    }

    public get(index: number): true | undefined
    {
        return this._sparse.has(index) || undefined;
    }

    public getUnchecked(_: number): true
    {
        return true;
    }

    public has(index: number): boolean
    {
        return this._sparse.has(index);
    }
}