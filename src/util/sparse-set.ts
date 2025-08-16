// noinspection JSUnusedGlobalSymbols

export type DeepReadonly<T> =
    T extends Array<infer U> // arrays become readonly arrays
        ? ReadonlyArray<DeepReadonly<U>>
        : T extends Function
            ? T
        : T extends object // nested objects recurse
            ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
            : T; // primitives stay the same

/**
 * Interface describing sparse set class operations.
 * @interface
 */
export interface ISparseSet<T>
{
    add(index: number, value: T): boolean;
    set(index: number, value: T): void;
    remove(index: number): T | undefined;
    get(index: number): T | undefined;
    getUnchecked(index: number): T;
    has(index: number): boolean;
}

/**
 * Interface representing a value bundled with an index.
 * @type
 */
export interface IndexedValue<T>
{
    index: number;
    value: T;
}

/**
 * A sparse set representation of a collection of objects.
 */
export class SparseSet<T> implements ISparseSet<T>
{
    /**
     * The sparse array mapping external access index to internal dense array index.
     * @private
     */
    private readonly _sparse: (number | undefined)[];

    private readonly _denseValue: T[];
    private readonly _denseIndex: number[];

    /**
     * Creates an instance of {@link SparseSet}.
     */
    public constructor()
    {
        this._sparse = [];
        this._denseValue = [];
        this._denseIndex = [];
    }

    /**
     * Adds the given value to the spot corresponding with the given index.
     * @param index
     * @param value
     */
    public add(index: number, value: T): boolean
    {
        if (this._sparse[index] !== undefined)
        {
            return false;
        }

        //this._dense.push({ index: index, value });
        this._denseValue.push(value);
        this._denseIndex.push(index);
        this._sparse[index] = this._denseValue.length - 1;

        return true;
    }

    public set(index: number, value: T): void {

        const sparse = this._sparse[index];

        if (sparse === undefined) return;

        //this._dense[sparse].value = value;
        this._denseValue[sparse] = value;

    }

    /**
     * Removes the value corresponding to the given index.
     * @param index
     */
    public remove(index: number): T | undefined
    {
        let denseIndex = this._sparse[index];

        if (denseIndex === undefined)
        {
            return undefined;
        }

        //const removed = this._dense[denseIndex];
        const removedValue = this._denseValue[denseIndex];

        this._denseValue[denseIndex] = this._denseValue[this._denseValue.length - 1];
        this._denseIndex[denseIndex] = this._denseIndex[this._denseIndex.length - 1];

        this._sparse[this._denseIndex[denseIndex]] = denseIndex;

        this._denseValue.pop();
        this._denseIndex.pop();

        return removedValue;
    }

    /**
     * Gets the value associated with provided index.
     * Returns null if the value is not found.
     * @param index
     */
    public get(index: number): T | undefined
    {
        let denseIndex = this._sparse[index];
        if (denseIndex === undefined) return undefined;

        return this._denseValue[denseIndex];
    }

    public __get(index: number): T {

        return this._denseValue[this._sparse[index]!]!;

    }

    public __getBatch(indices: number[], batch: T[], stride: number, offset: number): void {

        for (let i = 0; i < indices.length; i++) {

            batch[i * stride + offset] = this._denseValue[this._sparse[indices[i]!]!];

        }

    }

    /**
     * Checks for the existence of an index value in this {@link SparseSet}.
     * @param index
     */
    public has(index: number): boolean
    {
        return this._sparse[index] !== undefined
    }

    /**
     * Gets the value associated with the provided index.
     * Ignores the possibility of nullish values, use with caution.
     * @param index
     */
    public getUnchecked(index: number): T
    {
        let denseIndex = this._sparse[index]!;
        return this._denseValue[denseIndex];
    }
}