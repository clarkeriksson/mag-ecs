import { Bitset } from "./bitset";
import type { ISparseSet } from "./sparse-set.js";

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

    public remove(index: number): boolean | undefined
    {
        const value = this._map[index];

        delete this._map[index];

        return value ?? undefined;
    }

    public get(index: number): boolean | undefined
    {
        return this._map[index] ?? undefined;
    }

    public set(index: number, value: boolean): boolean
    {
        throw new Error("Attempted to");
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