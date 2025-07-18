import type { ISparseSet } from "./sparse-set";

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

    public remove(index: number): true | null
    {
        const removed = this._sparse.delete(index);
        return removed || null;
    }

    public get(index: number): true | null
    {
        return this._sparse.has(index) || null;
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