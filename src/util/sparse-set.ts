// noinspection JSUnusedGlobalSymbols

/**
 * Interface describing sparse set class operations.
 * @interface
 */
export interface ISparseSet<T>
{
    add(index: number, value: T): boolean;
    remove(index: number): T | null;
    get(index: number): T | null;
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

    /**
     * The dense array holding internal data in a packed form.
     * @private
     */
    private readonly _dense: IndexedValue<T>[];

    /**
     * Creates an instance of {@link SparseSet}.
     */
    public constructor()
    {
        this._sparse = [];
        this._dense = [];
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

        this._dense.push({ index: index, value });
        this._sparse[index] = this._dense.length - 1;

        return true;
    }

    /**
     * Removes the value corresponding to the given index.
     * @param index
     */
    public remove(index: number): T | null
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

    /**
     * Gets the value associated with provided index.
     * Returns null if the value is not found.
     * @param index
     */
    public get(index: number): T | null
    {
        let denseIndex = this._sparse[index];
        if (denseIndex === undefined) return null;

        return this._dense[denseIndex].value;
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
        return this._dense[denseIndex].value;
    }
}