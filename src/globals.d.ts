export declare global
{
    /**
     * Class constructor type.
     * Used for arguments or vars requiring the class object itself, not an instance.
     * @type
     */
    declare type ClassConstructor<T = any> = new (...args: any[]) => T;

    /**
     * Mapped class constructor type.
     * @type
     */
    declare type ClassConstructorsOf<T> = { [K in keyof T]: ClassConstructor<T[K]> };

    /**
     * Interface representing a value bundled with an index.
     * @type
     */
    declare interface IndexedValue<T>
    {
        index: number;
        value: T;
    }
}