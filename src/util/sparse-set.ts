class SparseSet<T>
{
    private readonly _sparse: (number | undefined)[];

    private readonly _dense: DenseEntry<T>[];

    public constructor()
    {
        this._sparse = [];
        this._dense = [];
    }

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

    public getUnchecked(index: number): T
    {
        let denseIndex = this._sparse[index]!;
        return this._dense[denseIndex].value;
    }
}

interface DenseEntry<T>
{
    index: number;
    value: T;
}