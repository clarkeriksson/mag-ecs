import { Bitset } from "./bitset";
import type { ISparseSet } from "./sparse-set";

/**
 * A sparse set representation of boolean values.
 * @class
 */
export class SparseBitSet implements ISparseSet<boolean>
{
    private readonly _sparse: (number | undefined)[];

    private readonly _dense: Bitset;

    public constructor()
    {
        this._sparse = new Array(Bitset.defaultSize);
        this._dense = new Bitset();
    }

    public add(index: number, value: boolean): boolean
    {
        if (this._sparse[index] !== undefined)
        {
            return false;
        }

        this._dense.set(this._dense.size, value);
        this._sparse[index] = this._dense.size - 1;

        return true;
    }

    public remove(index: number): boolean | null
    {
        const denseIndex = this._sparse[index];

        if (denseIndex === undefined)
        {
            return null;
        }

        const lastSparseIndex = this.findSparseIndexFor(this._dense.size - 1);
        if (lastSparseIndex === -1) throw new Error("Somehow, a sparse entry for the last dense value doesn't " +
            "exist.");

        const removed = this._dense.get(denseIndex);

        this._dense.set(denseIndex, this._dense.last);

        this._sparse[lastSparseIndex] = denseIndex;

        this._dense.pop();

        return removed;
    }

    public get(index: number): boolean | null
    {
        const denseIndex = this._sparse[index];
        if (denseIndex === undefined) return null;

        return this._dense.get(denseIndex);
    }

    public getUnchecked(index: number): boolean
    {
        const denseIndex = this._sparse[index]!;
        return this._dense.get(denseIndex);
    }

    public has(index: number): boolean
    {
        return this._sparse[index] !== undefined;
    }

    private findSparseIndexFor(denseIndex: number): number
    {
        return this._sparse.findIndex(value => value === denseIndex);
    }
}