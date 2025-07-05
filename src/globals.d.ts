export declare global
{
    /**
     * Non-nullish primitive types.
     */
    declare type ValueType = number | bigint | string | boolean | symbol;

    /**
     * Component type with a class instance as the data value.
     */
    declare type ClassComponentType<T> = {
        name: string;
        __isClassType: true;
        new (...args: ConstructorParameters<T>): { value: InstanceType<T>, type: ClassComponentType<T> };
    };

    /**
     * Component type with a non-nullish primitive as the data value.
     */
    declare type ValueComponentType<T> = {
        name: string;
        __isValueType: true;
        new (arg: T): { value: T, type: ValueComponentType<T> };
    };

    declare type ComponentType<T> = T extends new (...args: any[]) => any ? ClassComponentType<T> : ValueComponentType<T>;

    declare type ClassComponentInstance<T> = {
        value: InstanceType<T>;
        type: ClassComponentType<T>;
    };

    declare type ValueComponentInstance<T> = {
        value: T;
        type: ValueComponentType<T>;
    };

    declare type ComponentInstance<T> = T extends new (...args: any[]) => any ? ClassComponentInstance<T> : ValueComponentInstance<T>;

    declare type ComponentTypeTuple<T> = { [K in keyof T]: T[K] extends new (...args: any[]) => any ? ClassComponentType<T[K]> : ValueComponentType<T[K]> };

    declare type ComponentInstanceTuple<T> = { [K in keyof T]: T[K] extends new (...args: any[]) => any ? ClassComponentInstance<T[K]> : ValueComponentInstance<T[K]> };

    /**
     * True if T is a constructor type, false otherwise.
     */
    declare type IsConstructorType<T> = T extends new (...args: any[]) => any ? true : false;

    /**
     * True if T is a non-nullish primitive type, false otherwise.
     */
    declare type IsValueType<T> = T extends (number | bigint | string | boolean | symbol) ? true : false;

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