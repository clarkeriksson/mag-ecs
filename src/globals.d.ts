export declare global
{
    /**
     * Class constructor type.
     * Used for arguments or vars requiring the class object itself, not an instance.
     * @type
     */
    declare type ClassConstructor<T = any> = new (...args: any[]) => T;

    /**
     * Primitive keyed type.
     * Used for arguments of components that are tagged primitives.
     * @type
     */
    declare type ComponentKey<T = any> = symbol & { __type?: T };

    /**
     * Component type definitions.
     * @type
     */
    declare type ComponentType<T = any> = ClassConstructor<T>;

    /**
     * Maps an array of component types to their data's types.
     * @type
     */
    declare type ComponentTuple<T extends readonly ComponentType[]> = { [K in keyof T]: T[K] extends ComponentType<infer U> ? U : never };

    /**
     * Component value with it's associated type tag.
     * @type
     */
    declare type TaggedComponent<T = any> = { value: T, type: ComponentType<T> };

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