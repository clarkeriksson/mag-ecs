/**
 *
 */
export class ArrayPool
{
    private static readonly _instances: any[][] = [];

    public get length(): number { return ArrayPool._instances.length; }

    public static rent<T>(length: number = 0): T[]
    {
        let instance = this._instances.pop() ?? [];
        if (instance.length !== length)
        {
            instance.length = 0;
            instance.length = length;
        }

        return instance;
    }

    public static return(array: any[]): void
    {
        this._instances.push(array);
    }
}