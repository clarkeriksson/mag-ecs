export declare global
{
    declare type ClassConstructor<T = any> = new (...args: any[]) => T;

    declare type Tupled<T extends readonly any[]> = { [K in keyof T]: T[K] };

    /**
     * Non-nullish primitive types.
     */
    declare type ValueType = number | bigint | string | boolean | symbol;

    /**
     * Component type with a class instance as the data value.
     */
    declare type ClassComponentType<T, N extends string> = {
        name: N;
        __isClassType: true;
        new (...args: ConstructorParameters<T>): ClassComponentInstance<T, N>;
    };

    /**
     * Component type with a non-nullish primitive as the data value.
     */
    declare type ValueComponentType<T, N extends string> = {
        name: N;
        __isValueType: true;
        new (arg: T): ValueComponentInstance<T, N>;
    };

    declare type ComponentType<T, N extends string> = {
        name: N;
        new (...args: any[]): ComponentInstance<T, N>
    }

    //declare type ComponentType<T, N extends string = string> = T extends new (...args: any[]) => any ? ClassComponentType<T, N> : ValueComponentType<T, N>;

    declare type ClassComponentInstance<T, N extends string> = {
        value: InstanceType<T>;
        type: ClassComponentType<T, N>;
    };

    declare type ValueComponentInstance<T, N extends string> = {
        value: T;
        type: ValueComponentType<T, N>;
    };

    declare type ComponentInstance<T, N extends string> = {
        value: T;
        type: ComponentType<T, N>;
    }


    declare type ComponentInstanceTuple<T extends readonly ComponentType<any, string>[]> = {
        [K in keyof T]: T[K] extends ComponentType<infer D, infer N>
            ? ComponentInstance<D, N>
            : never;
    }

    //declare type ComponentTypeTuple<T extends readonly ComponentType<any, string>[]> = { [K in keyof T]: T[K] extends new (...args: any[]) => any
    //    ? ClassComponentType<T[K]>
    //    : ValueComponentType<T[K]> };

    //declare type ComponentInstanceTuple<T extends readonly ComponentType<any, string>[]> = { [K in keyof T]: T[K] extends new (...args: any[]) => any
    //    ? ClassComponentInstance<T[K]>
    //    : ValueComponentInstance<T[K]> };

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