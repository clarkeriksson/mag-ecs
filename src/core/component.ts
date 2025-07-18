// noinspection JSUnusedGlobalSymbols

import { ISparseSet } from "../util/sparse-set";
import { DeepReadonly } from "../util/sparse-set";

export type Tupled<T extends readonly any[]> = { [K in keyof T]: T[K] };

export type Constructor<T = any> = { new(...args: any[]): T };

type UnionToArray<T> = T extends any ? T[] : never;

export type ClassComponentType<T extends Constructor, N extends string> = {
    readonly name: N;
    readonly __isClassType: true;
    readonly __isValueType: false;
    readonly __isBooleanType: false;
    readonly __isTagType: false;
    readonly __static: false;
    readonly __readonly: false;
    new (...args: ConstructorParameters<T>): {
        value: InstanceType<T>;
        readonly type: ClassComponentType<T, N>;
    }
}
export type ClassComponentInstance<T extends Constructor, N extends string> = {
    value: InstanceType<T>;
    readonly type: ClassComponentType<T, N>;
}

export type ValueComponentType<T extends Value, N extends string> = {
    readonly name: N;
    readonly __isClassType: false;
    readonly __isValueType: true;
    readonly __isBooleanType: boolean;
    readonly __isTagType: boolean;
    readonly __static: false;
    readonly __readonly: false;
    new (arg: T): {
        value: T;
        readonly type: ValueComponentType<T, N>;
    }
}
export type ValueComponentInstance<T extends Value, N extends string> = {
    value: T;
    readonly type: ValueComponentType<T, N>;
}

export type ReadonlyClassComponentType<T extends Constructor, N extends string> = {
    readonly name: N;
    readonly __isClassType: true;
    readonly __isValueType: false;
    readonly __isBooleanType: false;
    readonly __isTagType: false;
    readonly __static: false;
    readonly __readonly: true;
    new (...args: ConstructorParameters<T>): {
        readonly value: DeepReadonly<InstanceType<T>>;
        readonly type: ReadonlyClassComponentType<T, N>;
    }
}
export type ReadonlyClassComponentInstance<T extends Constructor, N extends string> = {
    readonly value: DeepReadonly<InstanceType<T>>;
    readonly type: ReadonlyClassComponentType<T, N>;
}

export type ReadonlyValueComponentType<T extends Value, N extends string> = {
    readonly name: N;
    readonly __isClassType: false;
    readonly __isValueType: true;
    readonly __isBooleanType: boolean;
    readonly __isTagType: boolean;
    readonly __static: false;
    readonly __readonly: true;
    new (arg: T): {
        readonly value: DeepReadonly<T>;
        readonly type: ReadonlyValueComponentType<T, N>;
    }
}
export type ReadonlyValueComponentInstance<T extends Value, N extends string> = {
    readonly value: DeepReadonly<T>;
    readonly type: ReadonlyValueComponentType<T, N>;
}

export type StaticClassComponentType<T extends Constructor, N extends string> = {
    readonly name: N;
    readonly __isClassType: true;
    readonly __isValueType: false;
    readonly __isBooleanType: false;
    readonly __isTagType: false;
    readonly __static: true;
    readonly __readonly: false;
    new (...args: ConstructorParameters<T>): {
        value: InstanceType<T>;
        readonly type: StaticClassComponentType<T, N>;
    }
}
export type StaticClassComponentInstance<T extends Constructor, N extends string> = {
    value: InstanceType<T>;
    readonly type: StaticClassComponentType<T, N>;
}

export type StaticValueComponentType<T extends Value, N extends string> = {
    readonly name: N;
    readonly __isClassType: false;
    readonly __isValueType: true;
    readonly __isBooleanType: boolean;
    readonly __isTagType: boolean;
    readonly __static: true;
    readonly __readonly: false;
    new (arg: T): {
        value: T;
        readonly type: StaticValueComponentType<T, N>;
    }
}
export type StaticValueComponentInstance<T extends Value, N extends string> = {
    value: T;
    readonly type: StaticValueComponentType<T, N>;
}

export type StaticReadonlyClassComponentType<T extends Constructor, N extends string> = {
    readonly name: N;
    readonly __isClassType: true;
    readonly __isValueType: false;
    readonly __isBooleanType: false;
    readonly __isTagType: false;
    readonly __static: true;
    readonly __readonly: true;
    new (...args: ConstructorParameters<T>): {
        readonly value: DeepReadonly<InstanceType<T>>;
        readonly type: StaticReadonlyClassComponentType<T, N>;
    }
}
export type StaticReadonlyClassComponentInstance<T extends Constructor, N extends string> = {
    readonly value: DeepReadonly<InstanceType<T>>;
    readonly type: StaticReadonlyClassComponentType<T, N>;
}

export type StaticReadonlyValueComponentType<T extends Value, N extends string> = {
    readonly name: N;
    readonly __isClassType: false;
    readonly __isValueType: true;
    readonly __isBooleanType: boolean;
    readonly __isTagType: boolean;
    readonly __static: true;
    readonly __readonly: true;
    new (arg: T): {
        readonly value: DeepReadonly<T>;
        readonly type: StaticReadonlyValueComponentType<T, N>;
    }
}
export type StaticReadonlyValueComponentInstance<T extends Value, N extends string> = {
    readonly value: DeepReadonly<T>;
    readonly type: StaticReadonlyValueComponentType<T, N>;
}

export type ComponentType<T extends Constructor | Value, N extends string, Static extends boolean, Readonly extends boolean> =
    T extends Constructor
        ? (
            Static extends true
                ? (
                    Readonly extends true
                        ? StaticReadonlyClassComponentType<T, N>
                        : Readonly extends false ? StaticClassComponentType<T, N> : never
                ) : Static extends false ? (
                    Readonly extends true
                        ? ReadonlyClassComponentType<T, N>
                        : Readonly extends false ? ClassComponentType<T, N> : never
                ) : never
        ) : T extends Value ? (
            Static extends true
                ? (
                    Readonly extends true
                        ? StaticReadonlyValueComponentType<T, N>
                        : Readonly extends false ? StaticValueComponentType<T, N> : never
                ) : Static extends false ? (
                    Readonly extends true
                        ? ReadonlyValueComponentType<T, N>
                        : Readonly extends false ? ValueComponentType<T, N> : never
                ) : never
        ) : never;

export type ComponentInstance<T extends Constructor | Value, N extends string, Static extends boolean, Readonly extends boolean> =
    T extends Constructor
        ? (
            Static extends true
                ? (
                    Readonly extends true
                        ? StaticReadonlyClassComponentInstance<T, N>
                        : Readonly extends false ? StaticClassComponentInstance<T, N> : never
                    ) : Static extends false ? (
                    Readonly extends true
                        ? ReadonlyClassComponentInstance<T, N>
                        : Readonly extends false ? ClassComponentInstance<T, N> : never
                    ) : never
            ) : T extends Value ? (
            Static extends true
                ? (
                    Readonly extends true
                        ? StaticReadonlyValueComponentInstance<T, N>
                        : Readonly extends false ? StaticValueComponentInstance<T, N> : never
                    ) : Static extends false ? (
                    Readonly extends true
                        ? ReadonlyValueComponentInstance<T, N>
                        : Readonly extends false ? ValueComponentInstance<T, N> : never
                    ) : never
            ) : never;

export type ComponentTypeInstance<T extends ComponentType<any, any, any, any>> = InstanceType<T>;

export type QueryComponentType<T extends Constructor | Value, N extends string, Static extends boolean, Readonly extends boolean> =
    T extends Constructor
        ? (
            Static extends true
                ? (
                    StaticReadonlyClassComponentType<T, N>
                    ) : Static extends false ? (
                    Readonly extends true
                        ? ReadonlyClassComponentType<T, N>
                        : Readonly extends false ? ClassComponentType<T, N> : never
                    ) : never
            ) : T extends Value ? (
            Static extends true
                ? (
                    StaticReadonlyValueComponentType<T, N>
                    ) : Static extends false ? (
                    Readonly extends true
                        ? ReadonlyValueComponentType<T, N>
                        : Readonly extends false ? ValueComponentType<T, N> : never
                    ) : never
            ) : never;

export type QueryComponentTypeInstance<T extends QueryComponentType<any, any, any, any>> = InstanceType<T>;

export type ComponentInstanceTuple<T extends readonly ComponentType<any, any, any, any>[]> = {
    [K in keyof T]: T[K] extends ComponentType<any, any, any, any>
        ? ComponentTypeInstance<T[K]>
        : never;
}

export type QueryComponentInstanceTuple<T extends readonly ComponentType<any, any, any, any>[]> = {
    [K in keyof T]: T[K] extends ComponentType<any, any, true, false>
        ? DeepReadonly<ComponentTypeInstance<T[K]>>
        : T[K] extends ComponentType<any, any, any, any>
            ? ComponentTypeInstance<T[K]>
            : never;
}

/**
 * Non-nullish primitive types.
 */
export type ValuePrimitive = number | string | boolean;
export type ValueArray = UnionToArray<ValuePrimitive>;
export type Value = ValuePrimitive | ValueArray;
export type ValueObject = { [key: string]: Value | ValueObject };

export type DataType<T extends Constructor | Value> =
    T extends Constructor ? InstanceType<T> : T;

// /**
//  * Component type with a class instance as the data value.
//  */
// export type ClassComponentType<T extends Constructor, N extends string> = {
//     readonly name: N;
//     readonly __isClassType: true;
//     readonly __isValueType: false;
//     readonly __isBooleanType: false;
//     readonly __isTagType: false;
//     readonly __static: false;
//     new (...args: ConstructorParameters<T>): ClassComponentInstance<T, N>;
// };
//
// export type StaticClassComponentType<T extends Constructor, N extends string> = {
//     readonly name: N;
//     readonly __isClassType: true;
//     readonly __isValueType: false;
//     readonly __isBooleanType: false;
//     readonly __isTagType: false;
//     readonly __static: true;
//     new (...args: ConstructorParameters<T>): StaticClassComponentInstance<T, N>;
// }
//
// /**
//  * Component type with a non-nullish primitive as the data value.
//  */
// export type ValueComponentType<T extends Value, N extends string> = {
//     readonly name: N;
//     readonly __isClassType: false;
//     readonly __isValueType: true;
//     readonly __isBooleanType: boolean;
//     readonly __isTagType: boolean;
//     readonly __static: false;
//     new (arg: T): ValueComponentInstance<T, N>;
// };
//
// export type StaticValueComponentType<T extends Value, N extends string> = {
//     readonly name: N;
//     readonly __isClassType: false;
//     readonly __isValueType: true;
//     readonly __isBooleanType: boolean;
//     readonly __isTagType: boolean;
//     readonly __static: true;
//     new (arg: T): StaticValueComponentInstance<T, N>;
// }
//
// export type ComponentType<T extends Constructor | Value, N extends string> =
//     T extends Constructor
//         ? ClassComponentType<T, N>
//         : T extends Value
//         ? ValueComponentType<T, N>
//         : never;
//
// export type StaticComponentType<T extends Constructor | Value, N extends string> =
//     T extends Constructor
//         ? StaticClassComponentType<T, N>
//         : T extends Value
//         ? StaticValueComponentType<T, N>
//         : never;
//
// export type AnyComponentType<T extends Constructor | Value, N extends string> =
//     ComponentType<T, N> | StaticComponentType<T, N>;
//
// export type ClassComponentInstance<T extends Constructor, N extends string> = {
//     value: InstanceType<T>;
//     readonly type: ClassComponentType<T, N>;
// };
//
// export type ValueComponentInstance<T extends Value, N extends string> = {
//     value: T;
//     readonly type: ValueComponentType<T, N>;
// };
//
// export type StaticClassComponentInstance<T extends Constructor, N extends string> = {
//     readonly value: DeepReadonly<InstanceType<T>>;
//     readonly type: StaticClassComponentType<T, N>;
// }
//
// export type StaticValueComponentInstance<T extends Value, N extends string> = {
//     readonly value: DeepReadonly<T>;
//     readonly type: StaticValueComponentType<T, N>;
// }
//
// export type ComponentInstance<T extends Constructor | Value, N extends string> =
//     T extends Constructor
//         ? ClassComponentInstance<T, N>
//         : T extends Value
//         ? ValueComponentInstance<T, N>
//         : never;
//
// export type StaticComponentInstance<T extends Constructor | Value, N extends string> =
//     T extends Constructor
//         ? StaticClassComponentInstance<T, N>
//         : T extends Value
//         ? StaticValueComponentInstance<T, N>
//         : never;
//
// export type AnyComponentInstance<T extends Constructor | Value, N extends string> =
//     ComponentInstance<T, N> | StaticComponentInstance<T, N>;
//
// export type ComponentInstanceTuple<T extends readonly AnyComponentType<Constructor | Value, string>[]> = {
//     [K in keyof T]: T[K] extends ClassComponentType<infer C, infer CN>
//         ? ClassComponentInstance<C, CN>
//         : T[K] extends ValueComponentType<infer V, infer VN>
//             ? ValueComponentInstance<V, VN>
//             : T[K] extends StaticClassComponentType<infer SC, infer SCN>
//                 ? StaticClassComponentInstance<SC, SCN>
//                 : T[K] extends StaticValueComponentType<infer SV, infer SVN>
//                     ? StaticValueComponentInstance<SV, SVN>
//                     : never;
// }
//
// /*
// export type ComponentInstanceTuple<T extends readonly ComponentType<Constructor | Value, string>[]> = {
//     [K in keyof T]: T[K] extends ClassComponentType<infer D, infer N>
//         ? ClassComponentInstance<D, N>
//         : T[K] extends ValueComponentType<infer V, infer VN>
//             ? ValueComponentInstance<V, VN>
//             : never;
// }
// */
//
// export type ComponentValueTuple<T extends readonly ComponentType<Constructor | Value, string>[]> = {
//     [K in keyof T]: T[K] extends ComponentType<infer D, infer N>
//         ? ComponentInstance<D, N>['value']
//         : never;
// }

import {Bitset} from "../util/bitset";
import { SparseSet } from "../util/sparse-set";
import {SparseBitSet} from "../util/sparse-bit-set";
import {SparseTagSet} from "../util/sparse-tag-set";
/**
 * Pseudo-static class used to access and automatically manage component-type information.
 * @class
 */
export class Component<CmpType extends Constructor | Value, CmpName extends string, CmpStatic extends boolean, CmpReadonly extends boolean>
{
    /**
     * Holds the instances of {@link Component} for each {@link ComponentType}.
     * @private
     */
    private static readonly _statics: Map<ComponentType<any, string, boolean, boolean>, Component<any, string, boolean, boolean>> = new Map();

    /**
     * Counter for assigning unique Ids.
     * Reserved Bits: [0 as static flag]
     * @private
     */
    private static _idCounter: number = 1;

    /**
     * The internal representation of the {@link Component} id.
     * @private
     */
    private readonly _id: number;

    /**
     * The {@link Component} id, for when it is useful to identify component-types numerically.
     */
    public get id(): number { return this._id; }

    /**
     * The type of this {@link Component}.
     * @private
     */
    public readonly type: ComponentType<CmpType, CmpName, CmpStatic, CmpReadonly>;

    /**
     * The {@link Bitset} representing this component-type.
     */
    public signature: Bitset;

    /**
     * The instances of this component-type. Members of the class this {@link Component} represents.
     * @private
     */
    private readonly _instances: ISparseSet<any>;

    /**
     * Component wrapper instance pool. If object pooling is not used, then due to how ECS works a ton of garbage
     * would be created constantly.
     * @private
     */
    private readonly _instancePool: ComponentTypeInstance<ComponentType<CmpType, CmpName, CmpStatic, CmpReadonly>>[];

    /**
     * Creates an instance of {@link Component}.
     * @param type
     * @private
     */
    private constructor(type: ComponentType<CmpType, CmpName, CmpStatic, CmpReadonly>)
    {
        this.type = type;
        this._id = Component._idCounter++;
        this.signature = new Bitset();
        this.signature.set(this._id, true);

        if (type.__isValueType)
        {
            if (type.__isBooleanType)
            {
                this._instances = new SparseBitSet();
            }
            else if (type.__isTagType)
            {
                this._instances = new SparseTagSet();
            }
            else
            {
                this._instances = new SparseSet();
            }
        }
        else
        {
            this._instances = new SparseSet();
        }

        this._instancePool = [];
        Component._statics.set(type, this);
    }

    /**
     * Provides the unique {@link Component} instance associated with the type provided.
     * Automatically sets up a new instance if necessary.
     * @param type
     * @constructor
     */
    public static T<T extends Constructor | Value, N extends string, S extends boolean, R extends boolean>(type: ComponentType<T, N, S, R>): Component<T, N, S, R>
    {
        let $static = Component._statics.get(type);
        return ($static ?? this.addUnchecked(type)) as Component<T, N, S, R>;
    }

    /**
     * Creates a class component type. Wraps a class constructor in another constructor that emits an object containing
     * the component data, and it's associated type.
     * @param ctor
     * @param name
     * @param isStatic
     * @param isReadonly
     */
    private static classComponentBuilder<T extends Constructor, N extends string, S extends boolean, R extends boolean>(ctor: T, name: N, isStatic: S, isReadonly: R)
    {
        class ClassComponent
        {
            public static readonly name: N = name;
            public static readonly __isClassType = true;
            public static readonly __isValueType = false;
            public static readonly __isBooleanType = false;
            public static readonly __isTagType = false;
            public static readonly __static = isStatic;
            public static readonly __readonly = isReadonly;

            public value: R extends true ? DeepReadonly<InstanceType<T>> : InstanceType<T>;
            public readonly type: typeof ClassComponent;

            constructor(...args: ConstructorParameters<T>)
            {
                this.value = new ctor(...args) as (R extends true ? DeepReadonly<InstanceType<T>> : InstanceType<T>);
                this.type = ClassComponent;
            }
        }

        return ClassComponent as unknown as ComponentType<T, N, S, R>;
    }
    public static createClassComponent<T extends Constructor, N extends string>(ctor: T, name: N): ClassComponentType<T extends Constructor ? T : never, N>
    {
        return Component.classComponentBuilder<T, N, false, false>(ctor, name, false, false);
    }
    public static createStaticClassComponent<T extends Constructor, N extends string>(ctor: T, name: N): StaticClassComponentType<T extends Constructor ? T : never, N>
    {
        return Component.classComponentBuilder<T, N, true, false>(ctor,name, true, false);
    }
    public static createReadonlyClassComponent<T extends Constructor, N extends string>(ctor: T, name: N): ReadonlyClassComponentType<T extends Constructor ? T : never, N>
    {
        return Component.classComponentBuilder<T, N, false, true>(ctor, name, false, true);
    }
    public static createStaticReadonlyClassComponent<T extends Constructor, N extends string>(ctor: T, name: N): StaticReadonlyClassComponentType<T extends Constructor ? T : never, N>
    {
        return Component.classComponentBuilder<T, N, true, true>(ctor, name, true, true);
    }

    /**
     * Creates a value component type. Creates a custom constructor that emits an object containing the primitive
     * component data, and it's associated type.
     * @param name
     * @param isStatic
     * @param isReadonly
     */
    private static valueComponentBuilder<T extends Value, N extends string, S extends boolean, R extends boolean>(name: N, isStatic: S, isReadonly: R, isBoolean: boolean, isTag: boolean)
    {
        class ValueComponent
        {
            public static readonly name: N = name;
            public static readonly __isClassType: false = false;
            public static readonly __isValueType: true = true;
            public static readonly __isBooleanType: boolean = isBoolean;
            public static readonly __isTagType: boolean = isTag;
            public static readonly __static: S = isStatic;
            public static readonly __readonly: R = isReadonly;

            public value: R extends true ? DeepReadonly<T> : T;
            public readonly type: typeof ValueComponent;

            constructor(arg: T)
            {
                this.value = arg as (R extends true ? DeepReadonly<T> : T);
                this.type = ValueComponent;
            }
        }

        return ValueComponent as unknown as ComponentType<T, N, S, R>;
    }
    public static createValueComponent<T extends Value, const N extends string>(name: N, { isBoolean, isTag }: { isBoolean: boolean, isTag: boolean } = { isBoolean: false, isTag: false }): ValueComponentType<T, N>
    {
        return Component.valueComponentBuilder<T, N, false, false>(name, false, false, isBoolean, isTag) as ValueComponentType<T, N>;
    }
    public static createStaticValueComponent<T extends Value, const N extends string>(name: N, { isBoolean, isTag }: { isBoolean: boolean, isTag: boolean } = { isBoolean: false, isTag: false }): StaticValueComponentType<T, N>
    {
        return Component.valueComponentBuilder<T, N, true, false>(name, true, false, isBoolean, isTag) as StaticValueComponentType<T, N>;
    }
    public static createReadonlyValueComponent<T extends Value, const N extends string>(name: N, { isBoolean, isTag }: { isBoolean: boolean, isTag: boolean } = { isBoolean: false, isTag: false }): ReadonlyValueComponentType<T, N>
    {
        return Component.valueComponentBuilder<T, N, false, true>(name, false, true, isBoolean, isTag) as ReadonlyValueComponentType<T, N>;
    }
    public static createStaticReadonlyValueComponent<T extends Value, const N extends string>(name: N, { isBoolean, isTag }: { isBoolean: boolean, isTag: boolean } = { isBoolean: false, isTag: false }): StaticReadonlyValueComponentType<T, N>
    {
        return Component.valueComponentBuilder<T, N, true, true>(name, true, true, isBoolean, isTag) as StaticReadonlyValueComponentType<T, N>;
    }

    // /**
    //  * Creates a boolean component type. Technically a subset of the value component type, with a specific type of
    //  * boolean. Optimized to use bitsets for this purpose.
    //  * @param name
    //  * @param isStatic
    //  */
    // private static booleanComponentBuilder<N extends string, I extends boolean>(name: N, isStatic: I)
    // {
    //     class BooleanComponent
    //     {
    //         public static name: N = name;
    //         public static __isClassType: false = false;
    //         public static __isValueType: true = true;
    //         public static __isBooleanType: boolean = true;
    //         public static __isTagType: boolean = false;
    //         public static __static: I = isStatic;
    //
    //         public value: I extends true ? DeepReadonly<boolean> : boolean;
    //         public type: typeof BooleanComponent;
    //
    //         constructor(arg: boolean) {
    //             this.value = arg as (I extends true ? DeepReadonly<boolean> : boolean);
    //             this.type = BooleanComponent;
    //         }
    //     }
    //
    //     return BooleanComponent;
    // }
    // public static createBooleanComponent<const N extends string>(name: N): ValueComponentType<boolean, N>
    // {
    //     return Component.booleanComponentBuilder<N, false>(name, false);
    // }
    // public static createStaticBooleanComponent<const N extends string>(name: N): StaticValueComponentType<boolean, N>
    // {
    //     return Component.booleanComponentBuilder<N, true>(name, true);
    // }
    //
    // /**
    //  * Creates a tag component type. Technically a subset of the value component type, with a type of exclusively
    //  * the boolean 'true' value. Optimized to use bitsets for this purpose.
    //  * @param name
    //  * @param isStatic
    //  */
    // private static tagComponentBuilder<N extends string, I extends boolean>(name: N, isStatic: I)
    // {
    //     class TagComponent
    //     {
    //         public static name: N = name;
    //         public static __isClassType: false = false;
    //         public static __isValueType: true = true;
    //         public static __isBooleanType: boolean = false;
    //         public static __isTagType: boolean = true;
    //         public static __static: I = isStatic;
    //
    //         public value: I extends true ? DeepReadonly<true> : true;
    //         public type: typeof TagComponent;
    //
    //         constructor(arg: true = true)
    //         {
    //             this.value = arg as (I extends true ? DeepReadonly<true> : true);
    //             this.type = TagComponent;
    //         }
    //     }
    //
    //     return TagComponent;
    // }
    // public static createTagComponent<const N extends string>(name: N): ValueComponentType<true, N>
    // {
    //     return this.tagComponentBuilder<N, false>(name, false);
    // }
    // public static createStaticTagComponent<const N extends string>(name: N): StaticValueComponentType<true, N>
    // {
    //     return this.tagComponentBuilder<N, true>(name, true);
    // }

    /**
     * Gets the {@link SparseSet} of component-type instances.
     * Creates the {@link Component} instance if it does not exist.
     * @param type
     */
    public static getSet<T extends Constructor | Value, N extends string, S extends boolean, R extends boolean>(type: ComponentType<T, N, S, R>): ISparseSet<T extends Constructor ? InstanceType<T> : T>
    {
        return Component.T(type)._instances as ISparseSet<T extends Constructor ? InstanceType<T> : T>;
    }

    /**
     * Gets a component instance for the given index from the {@link SparseSet} of instances.
     * Returns null if none are found.
     * @param index
     * @param type
     */
    public static get<T extends Constructor | Value, N extends string, S extends boolean, R extends boolean>(index: number, type: ComponentType<T, N, S, R>): null | ComponentTypeInstance<ComponentType<T, N, S, R>>
    {
        const value = Component.getSet(type).get(index);
        return (value === null) ? null : Component.createLiteralInstance(value, type);
    }

    /**
     * Grabs a component-type instance for the given index from the {@link SparseSet} of instances.
     * Performs no check for existence, use with caution.
     * @param index
     * @param type
     */
    public static getUnchecked<T extends Constructor | Value, N extends string, S extends boolean, R extends boolean>(index: number, type: ComponentType<T, N, S, R>): ComponentTypeInstance<ComponentType<T, N, S, R>>
    {
        const value = Component.getSet(type).getUnchecked(index) as (T extends Constructor ? InstanceType<T> : T);
        return Component.rentInstance(type, value);
    }

    /**
     * Sets the component-type {@link SparseSet} with the given value at the given index.
     * Creates the {@link Component} instance if it does not exist.
     * @param index
     * @param component
     */
    public static set(index: number, component: ComponentTypeInstance<ComponentType<any, string, boolean, boolean>>): void
    {
        Component.getSet(component.type).add(index, component.value);
    }

    /**
     * Checks if an entity has a component of a given type.
     * @param index
     * @param type
     */
    public static has<T extends Constructor | Value, N extends string, S extends boolean, R extends boolean>(index: number, type: ComponentType<T, N, S, R>): boolean
    {
        return Component.getSet(type).has(index);
    }

    /**
     * Removes all component-type instances corresponding to the given index.
     * @param index
     */
    public static removeAll(index: number): boolean
    {
        let result = false;
        for (const component of Component._statics.values())
        {
            result ||= component._instances.remove(index) !== null;
        }
        return result;
    }

    /**
     * Removes a specific component type from the given index.
     * @param index
     * @param type
     */
    public static removeComponent<T extends Constructor | Value, N extends string, S extends boolean, R extends boolean>(index: number, type: ComponentType<T, N, S, R>): null | ComponentTypeInstance<ComponentType<T, N, S, R>>
    {
        const value = Component.getSet(type).remove(index);
        return (value === null) ? null : Component.createLiteralInstance(value, type);
    }

    /**
     * Creates a new instance of {@link Component} from the given constructor.
     * Does not check for uniqueness, use with caution.
     * @param type
     * @private
     */
    private static addUnchecked<T extends Constructor | Value, N extends string, S extends boolean, R extends boolean>(type: ComponentType<T, N, S, R>): Component<T, N, S, R>
    {
        return new Component(type);
    }

    /**
     * Provides a unique {@link Bitset} from the provided component-types.
     * @param types
     */
    public static bitsetFromTypes(...types: ComponentType<any, string, boolean, boolean>[]): Bitset
    {
        const result = new Bitset();
        for (const type of types)
        {
            result.set(Component.T(type).id, true);
        }
        return result;
    }

    /**
     * Provides a unique {@link Bitset} from the provided tagged component instances.
     * @param components
     */
    public static bitsetFromComponents<T extends ComponentTypeInstance<ComponentType<any, string, boolean, boolean>>[]>(...components: T): Bitset
    {
        const result = new Bitset();
        for (let i = 0; i < components.length; i++)
        {
            const component = components[i];
            result.set(Component.T(component.type).id, true);
        }
        return result;
    }

    /**
     * Gets all currently registered component types.
     */
    public static getAllTypes(): ComponentType<any, string, boolean, boolean>[]
    {
        return Array.from(Component._statics.keys());
    }

    /**
     * Gets the {@link Component} instance for a given type.
     * @param type
     */
    public static metadata<T extends Constructor | Value, N extends string, S extends boolean, R extends boolean>(type: ComponentType<T, N, S, R>): Component<T, N, S, R> | null
    {
        return Component._statics.get(type as any) as Component<T, N, S, R> ?? null;
    }

    /**
     * Clears the static instances.
     */
    public static dispose(): void
    {
        Component._statics.clear();
        Component._idCounter = 0;
    }

    /**
     * Rents a component wrapper instance.
     * @param type
     * @param value
     * @private
     */
    private static rentInstance<T extends Constructor | Value, N extends string, S extends boolean, R extends boolean>(type: ComponentType<T, N, S, R>, value: T extends Constructor ? InstanceType<T> : T): ComponentTypeInstance<ComponentType<T, N, S, R>>
    {
        const component = Component.T(type);
        let rented = component._instancePool.pop() ?? Component.createLiteralInstance(value, type);

        // Bypassing readonly here since the rented is being mutated for reuse.
        (rented.value as any) = value;
        (rented.type as any) = type;

        return rented;
    }

    /**
     * Returns a rented component wrapper instance to its pool.
     * @param instance
     * @private
     */
    public static returnInstance<T extends Constructor | Value, N extends string, S extends boolean, R extends boolean>(instance: ComponentTypeInstance<ComponentType<T, N, S, R>>): void
    {
        const component = Component.T(instance.type as ComponentType<T, N, S, R>);
        component._instancePool.push(instance);
    }

    /**
     * Returns many rented component wrapper instances to their pools.
     * @param instances
     * @private
     */
    public static returnInstances<T extends ComponentTypeInstance<ComponentType<any, string, boolean, boolean>>[]>(...instances: T): void
    {
        for (const instance of instances)
        {
            Component.returnInstance(instance);
        }
    }

    /**
     * Creates an object literal of the appropriate component instance type.
     * @param value
     * @param type
     * @private
     */
    private static createLiteralInstance<T extends Constructor | Value, N extends string, S extends boolean, R extends boolean>(
        value: T extends Constructor ? InstanceType<T> : T,
        type: ComponentType<T, N, S, R>,
    ) : ComponentTypeInstance<ComponentType<T, N, S, R>>
    {
        type ValueType = typeof type extends { __static: true }
            ? DeepReadonly<typeof value>
            : typeof value;

        return { value: value as ValueType, type } as ComponentTypeInstance<ComponentType<T, N, S, R>>;
    }
}