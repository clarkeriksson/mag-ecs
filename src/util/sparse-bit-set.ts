import { Bitset } from "./bitset";
import type { ISparseSet } from "./sparse-set";

/**
 * A sparse set representation of boolean values.
 * @class
 */
export class SparseBitSet implements ISparseSet<boolean>
{
    private readonly _map: { [k: number]: boolean };

    public constructor()
    {
        this._map = {};
    }

    public add(index: number, value: boolean): boolean
    {
        if (index in this._map)
        {
            return false;
        }

        this._map[index] = value;

        return true;
    }

    public remove(index: number): boolean | null
    {
        const value = this._map[index];

        delete this._map[index];

        return value ?? null;
    }

    public get(index: number): boolean | null
    {
        return this._map[index] ?? null;
    }

    public getUnchecked(index: number): boolean
    {
        return this._map[index] as boolean;
    }

    public has(index: number): boolean
    {
        return index in this._map;
    }
}