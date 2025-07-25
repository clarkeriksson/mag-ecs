/**
 *
 */
export class ArrayPool<T>
{
    private readonly _instances: T[][] = [];

    public get length(): number { return this._instances.length; }

    constructor()
    {
        this._instances = [];
    }

    public rent(length: number = 0): T[]
    {
        let instance = this._instances.pop() ?? [];
        if (instance.length !== length)
        {
            instance.length = length;
        }

        return instance;
    }

    public return(array: T[]): void
    {
        this._instances.push(array);
    }
}