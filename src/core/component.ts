// noinspection JSUnusedGlobalSymbols

import { ISparseSet } from "../util/sparse-set";

export type ClassConstructor<T = any> = new (...args: any[]) => T;

export type Tupled<T extends readonly any[]> = { [K in keyof T]: T[K] };

/**
 * Non-nullish primitive types.
 */
export type ValueType = number | bigint | string | boolean | symbol;

export type ValueTypeName = "number" | "bigint" | "string" | "boolean" | "symbol";

/**
 * Component type with a class instance as the data value.
 */
export type ClassComponentType<T extends ClassConstructor, N extends string> = {
    name: N;
    __isClassType: true;
    new (...args: ConstructorParameters<T>): ClassComponentInstance<T, N>;
};

/**
 * Component type with a non-nullish primitive as the data value.
 */
export type ValueComponentType<T, N extends string> = {
    name: N;
    __isValueType: true;
    __isBooleanType: boolean;
    __isTagType: boolean;
    new (arg: T): ValueComponentInstance<T, N>;
};

export type ComponentType<T, N extends string> = {
    name: N;
    new (...args: any[]): ComponentInstance<T, N>;
    __isValueType?: true;
    __isBooleanType?: boolean;
    __isTagType?: boolean;
    __isClassType?: true;
}

export type ClassComponentInstance<T extends ClassConstructor, N extends string> = {
    value: InstanceType<T>;
    type: ClassComponentType<T, N>;
};

export type ValueComponentInstance<T, N extends string> = {
    value: T;
    type: ValueComponentType<T, N>;
};

export type ComponentInstance<T, N extends string> = {
    value: T;
    type: ComponentType<T, N>;
}

export type ComponentInstanceTuple<T extends readonly ComponentType<any, string>[]> = {
    [K in keyof T]: T[K] extends ComponentType<infer D, infer N>
        ? ComponentInstance<D, N>
        : never;
}

export type ComponentValueTuple<T extends readonly ComponentType<any, string>[]> = {
    [K in keyof T]: T[K] extends ComponentType<infer D, infer N>
        ? ComponentInstance<D, N>['value']
        : never;
}

import {Bitset} from "../util/bitset";
import { SparseSet } from "../util/sparse-set";
import {SparseBitSet} from "../util/sparse-bit-set";
import {SparseTagSet} from "../util/sparse-tag-set";
/**
 * Pseudo-static class used to access and automatically manage component-type information.
 * @class
 */
export class Component<C, I extends string>
{
    /**
     * Holds the instances of {@link Component} for each {@link ComponentType}.
     * @private
     */
    private static readonly _statics: Map<ComponentType<any, string>, Component<any, string>> = new Map();

    /**
     * Counter for assigning unique Ids.
     * @private
     */
    private static _idCounter: number = 0;

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
    public readonly type: ComponentType<C, I>;

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
     * Creates an instance of {@link Component}.
     * @param type
     * @private
     */
    private constructor(type: ComponentType<C, I>)
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

        Component._statics.set(type, this);
    }

    /**
     * Provides the unique {@link Component} instance associated with the type provided.
     * Automatically sets up a new instance if necessary.
     * @param type
     * @constructor
     */
    public static T<T, N extends string>(type: ComponentType<T, N>): Component<T, N>
    {
        let $static = Component._statics.get(type) as Component<T, N>;
        return $static ?? this.addUnchecked(type);
    }

    /**
     * Creates a class component type. Wraps a class constructor in another constructor that emits an object containing
     * the component data, and it's associated type.
     * @param ctor
     * @param name
     */
    public static createClassComponent<T extends new (...args: any[]) => any, N extends string>(ctor: T, name: N): ClassComponentType<T, N>
    {
        class PseudoClass
        {
            public static name: N = name;
            public static __isClassType: true = true;

            public value: InstanceType<T>;
            public type: typeof PseudoClass;

            constructor(...args: ConstructorParameters<T>)
            {
                this.value = new ctor(...args);
                this.type = PseudoClass;
            }
        }

        return PseudoClass;
    }

    /**
     * Creates a value component type. Creates a custom constructor that emits an object containing the primitive
     * component data, and it's associated type.
     * @param type
     * @param name
     */
    public static createValueComponent<T extends ValueType, const N extends string>(type: ValueTypeName, name: N): ValueComponentType<T, N>
    {
        class PseudoValue
        {
            public static name: N = name;
            public static __isValueType: true = true;
            public static __isBooleanType: boolean = (type === "boolean");
            public static __isTagType: boolean = false;

            public value: T;
            public type: typeof PseudoValue;

            constructor(arg: T)
            {
                this.value = arg;
                this.type = PseudoValue;
            }
        }

        return PseudoValue;
    }

    /**
     * Creates a tag component type. Technically a subset of the value component type, with a type of exclusively
     * the boolean 'true' value. Optimized to use bitsets for this purpose.
     * @param name
     */
    public static createTagComponent<const N extends string>(name: N): ValueComponentType<true, N>
    {
        class PseudoValue
        {
            public static name: N = name;
            public static __isValueType: true = true;
            public static __isBooleanType: boolean = false;
            public static __isTagType: boolean = true;

            public value: true;
            public type: typeof PseudoValue;

            constructor(arg: true = true)
            {
                this.value = arg;
                this.type = PseudoValue;
            }
        }

        return PseudoValue;
    }

    /**
     * Gets the {@link SparseSet} of component-type instances.
     * Creates the {@link Component} instance if it does not exist.
     * @param type
     */
    public static getSet<T, N extends string>(type: ComponentType<T, N>): SparseSet<T>
    {
        return Component.T(type)._instances as SparseSet<T>;
    }

    /**
     * Gets a component instance for the given index from the {@link SparseSet} of instances.
     * Returns null if none are found.
     * @param index
     * @param type
     */
    public static get<T, N extends string>(index: number, type: ComponentType<T, N>): ComponentInstance<T, N> | null
    {
        const value = Component.getSet(type).get(index);
        return (value === null) ? null : { value, type };
    }

    /**
     * Grabs a component-type instance for the given index from the {@link SparseSet} of instances.
     * Performs no check for existence, use with caution.
     * @param index
     * @param type
     */
    public static getUnchecked<T, N extends string>(index: number, type: ComponentType<T, N>): ComponentInstance<T, N>
    {
        const value = Component.getSet(type).getUnchecked(index);
        return { value, type };
    }

    /**
     * Sets the component-type {@link SparseSet} with the given value at the given index.
     * Creates the {@link Component} instance if it does not exist.
     * @param index
     * @param component
     */
    public static set(index: number, component: ComponentInstance<any, string>): void
    {
        Component.getSet(component.type).add(index, component.value);
    }

    /**
     * Checks if an entity has a component of a given type.
     * @param index
     * @param type
     */
    public static has<T, N extends string>(index: number, type: ComponentType<T, N>): boolean
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
    public static removeComponent<T, N extends string>(index: number, type: ComponentType<T, N>): ComponentInstance<T, N> | null
    {
        const value = Component.getSet(type).remove(index);
        return (value === null) ? null : { value, type };
    }

    /**
     * Creates a new instance of {@link Component} from the given constructor.
     * Does not check for uniqueness, use with caution.
     * @param type
     * @private
     */
    private static addUnchecked<T, N extends string>(type: ComponentType<T, N>): Component<T, N>
    {
        return new Component(type);
    }

    /**
     * Provides a unique {@link Bitset} from the provided component-types.
     * @param types
     */
    public static bitsetFromTypes(...types: ComponentType<any, string>[]): Bitset
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
    public static bitsetFromComponents<T extends ComponentInstance<any, string>[]>(...components: T): Bitset
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
    public static getAllTypes(): ComponentType<any, string>[]
    {
        return Array.from(Component._statics.keys());
    }

    /**
     * Gets the {@link Component} instance for a given type.
     * @param type
     */
    public static metadata<T, N extends string>(type: ComponentType<T, N>): Component<T, N> | null
    {
        return Component._statics.get(type as any) as Component<T, N> ?? null;
    }

    /**
     * Clears the static instances.
     */
    public static dispose(): void
    {
        Component._statics.clear();
        Component._idCounter = 0;
    }
}