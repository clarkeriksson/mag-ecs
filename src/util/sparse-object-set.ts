import type { ISparseSet, IndexedValue } from "./sparse-set.js";

import type {Constructor, ValueObject} from "../core/component.js";

type DeepReadonly<T> =
    T extends Array<infer U> // arrays become readonly arrays
        ? ReadonlyArray<DeepReadonly<U>>
        : T extends object // nested objects recurse
            ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
            : T; // primitives stay the same

/**
 *
 */
export class SparseObjectSet<
    T extends Constructor<ValueObject>,
    I extends ValueObject = T extends Constructor<ValueObject> ? InstanceType<T> : never
>
    implements ISparseSet<I>
{
    private readonly _sparse: (number | undefined)[];

    private readonly _dense: IndexedValue<I>[];

    public constructor()
    {
        this._sparse = [];
        this._dense = [];
    }

    public add(index: number, value: I): boolean
    {
        if (this._sparse[index] === undefined)
        {
            return false;
        }

        this._dense.push({ index, value });
        this._sparse[index] = this._dense.length - 1;

        return true;
    }

    public remove(index: number): I | null
    {
        let denseIndex = this._sparse[index];

        if (denseIndex === undefined)
        {
            return null;
        }

        const removed = this._dense[denseIndex];

        this._dense[denseIndex] = this._dense[this._dense.length - 1];

        this._sparse[this._dense[denseIndex].index] = denseIndex;

        this._dense.pop();

        return removed.value;
    }

    public get(index: number): I | null
    {
        let denseIndex = this._sparse[index];
        if (denseIndex === undefined) return null;

        return this._dense[denseIndex].value;
    }

    public getUnchecked(index: number): I
    {
        let denseIndex = this._sparse[index]!;
        return this._dense[denseIndex].value;
    }

    public has(index: number): boolean
    {
        return this._sparse[index] !== undefined;
    }
}