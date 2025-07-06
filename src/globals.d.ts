declare global
{
    type ClassConstructor<T = any> = new (...args: any[]) => T;

    type Tupled<T extends readonly any[]> = { [K in keyof T]: T[K] };

    /**
     * Non-nullish primitive types.
     */
    type ValueType = number | bigint | string | boolean | symbol;

    /**
     * Component type with a class instance as the data value.
     */
    type ClassComponentType<T, N extends string> = {
        name: N;
        __isClassType: true;
        new (...args: ConstructorParameters<T>): ClassComponentInstance<T, N>;
    };

    /**
     * Component type with a non-nullish primitive as the data value.
     */
    type ValueComponentType<T, N extends string> = {
        name: N;
        __isValueType: true;
        new (arg: T): ValueComponentInstance<T, N>;
    };

    type ComponentType<T, N extends string> = {
        name: N;
        new (...args: any[]): ComponentInstance<T, N>;
        __isValueType?: true;
        __isClassType?: true;
    }

    //declare type ComponentType<T, N extends string = string> = T extends new (...args: any[]) => any ? ClassComponentType<T, N> : ValueComponentType<T, N>;

    type ClassComponentInstance<T, N extends string> = {
        value: InstanceType<T>;
        type: ClassComponentType<T, N>;
    };

    type ValueComponentInstance<T, N extends string> = {
        value: T;
        type: ValueComponentType<T, N>;
    };

    type ComponentInstance<T, N extends string> = {
        value: T;
        type: ComponentType<T, N>;
    }


    type ComponentInstanceTuple<T extends readonly ComponentType<any, string>[]> = {
        [K in keyof T]: T[K] extends ComponentType<infer D, infer N>
            ? ComponentInstance<D, N>
            : never;
    }

    type ComponentValueTuple<T extends readonly ComponentType<any, string>[]> = {
        [K in keyof T]: T[K] extends ComponentType<infer D, infer N>
            ? ComponentInstance<D, N>['value']
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
    type IsConstructorType<T> = T extends new (...args: any[]) => any ? true : false;

    /**
     * True if T is a non-nullish primitive type, false otherwise.
     */
    type IsValueType<T> = T extends (number | bigint | string | boolean | symbol) ? true : false;

    /**
     * Interface representing a value bundled with an index.
     * @type
     */
    interface IndexedValue<T>
    {
        index: number;
        value: T;
    }
}

export {};