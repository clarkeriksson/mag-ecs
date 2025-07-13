// noinspection JSUnusedGlobalSymbols

import { ISparseSet } from "../util/sparse-set";

export type Tupled<T extends readonly any[]> = { [K in keyof T]: T[K] };

export type Constructor<T = unknown> = { new(...args: any[]): T };

/**
 * Non-nullish primitive types.
 */
export type ValuePrimitive = number | bigint | string | boolean | symbol;

export type ValueObject = {
    [key: string]: ValueObject | ValuePrimitive;
}

export type Value = number | bigint | string | boolean | symbol | ValueObject;

/**
 * Component type with a non-nullish primitive as the data value.
 */
export type ComponentType<T extends Value, N extends string> = {
    name: N;
    __isBooleanType: boolean;
    __isTagType: boolean;
    new (arg: T): ComponentInstance<T, N>;
};

export type ComponentInstance<T extends Value, N extends string> = {
    value: T;
    type: ComponentType<T, N>;
};

export type ComponentTypeTuple<T extends readonly ComponentType<Value, string>[]> = {
    [K in keyof T]: T[K] extends ComponentType<infer D, infer N> ? ComponentType<D, N> : never;
}

export type ComponentInstanceTuple<T extends readonly ComponentType<Value, string>[]> = {
    [K in keyof T]: T[K] extends ComponentType<infer D, infer N> ? ComponentInstance<D, N> : never;
}

export type ComponentValueTuple<T extends readonly ComponentType<Value, string>[]> = {
    [K in keyof T]: T[K] extends ComponentType<infer D, infer N>
        ? ComponentInstance<D, N>['value']
        : never;
}

export type ComponentSchema = {
    [key: string]: ComponentSchema | ComponentType<Value, string>;
}

import { Bitset } from "../util/bitset";
import { SparseSet } from "../util/sparse-set";
import { SparseBitSet } from "../util/sparse-bit-set";
import { SparseTagSet } from "../util/sparse-tag-set";
/**
 * Pseudo-static class used to access and automatically manage component-type information.
 * @class
 */
export class Component<C extends Value, I extends string>
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
     * Component wrapper instance pool. If object pooling is not used, then due to how ECS works a ton of garbage
     * would be created constantly.
     * @private
     */
    private readonly _instancePool: ComponentInstance<C, I>[];

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

        this._instancePool = [];
        Component._statics.set(type, this);
    }

    /**
     * Provides the unique {@link Component} instance associated with the type provided.
     * Automatically sets up a new instance if necessary.
     * @param type
     * @constructor
     */
    public static T<T extends Value, N extends string>(type: ComponentType<T, N>): Component<T, N>
    {
        let $static = Component._statics.get(type);
        return ($static ?? this.addUnchecked(type)) as Component<T, N>;
    }

    /**
     * Creates a value component type. Creates a custom constructor that emits an object containing the primitive
     * component data, and it's associated type.
     * @param name
     */
    public static createComponent<T extends Value, const N extends string>(name: N): ComponentType<T, N>
    {
        class PseudoValue
        {
            public static name: N = name;
            public static __isClassType: false = false;
            public static __isValueType: true = true;
            public static __isBooleanType: boolean = false;
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
     * Creates a boolean component type. Technically a subset of the value component type, with a specific type of
     * boolean. Optimized to use bitsets for this purpose.
     * @param name
     */
    public static createBooleanComponent<const N extends string>(name: N): ComponentType<boolean, N>
    {
        class PseudoValue
        {
            public static name: N = name;
            public static __isClassType: false = false;
            public static __isValueType: true = true;
            public static __isBooleanType: boolean = true;
            public static __isTagType: boolean = false;

            public value: boolean;
            public type: typeof PseudoValue;

            constructor(arg: boolean)
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
    public static createTagComponent<const N extends string>(name: N): ComponentType<true, N>
    {
        class PseudoValue
        {
            public static name: N = name;
            public static __isClassType: false = false;
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
    public static getSet<T extends Value, N extends string>(type: ComponentType<T, N>): ISparseSet<T>
    {
        return Component.T(type)._instances as ISparseSet<T>;
    }

    /**
     * Gets a component instance for the given index from the {@link SparseSet} of instances.
     * Returns null if none are found.
     * @param index
     * @param type
     */
    public static get<T extends Value, N extends string>(index: number, type: ComponentType<T, N>): null | ComponentInstance<T, N>
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
    public static getUnchecked<T extends Value, N extends string>(index: number, type: ComponentType<T, N>): ComponentInstance<T, N>
    {
        const value = Component.getSet(type).getUnchecked(index);
        return Component.rentInstance(type, value);
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
    public static has<T extends Value, N extends string>(index: number, type: ComponentType<T, N>): boolean
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
    public static removeComponent<T extends Value, N extends string>(index: number, type: ComponentType<T, N>): null | ComponentInstance<T, N>
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
    private static addUnchecked<T extends Value, N extends string>(type: ComponentType<T, N>): Component<T, N>
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
    public static metadata<T extends Value, N extends string>(type: ComponentType<T, N>): Component<T, N> | null
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

    /**
     * Rents a component wrapper instance.
     * @param type
     * @param value
     * @private
     */
    private static rentInstance<T extends Value, N extends string>(type: ComponentType<T, N>, value: T): ComponentInstance<T, N>
    {
        const component = Component.T(type);
        let rented = component._instancePool.pop() ?? Component.createLiteralInstance(value, type);

        rented.value = value;
        rented.type = type;

        return rented;
    }

    /**
     * Returns a rented component wrapper instance to its pool.
     * @param instance
     * @private
     */
    public static returnInstance<T extends Value, N extends string>(instance: ComponentInstance<T, N>): void
    {
        const component = Component.T(instance.type);
        component._instancePool.push(instance);
    }

    /**
     * Returns many rented component wrapper instances to their pools.
     * @param instances
     * @private
     */
    public static returnInstances<T extends ComponentInstance<any, string>[]>(...instances: T): void
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
    private static createLiteralInstance<T extends Value, N extends string>(
        value: T,
        type: ComponentType<T, N>
    ) : ComponentInstance<T, N>
    {
        return { value, type } as ComponentInstance<T, N>;
    }
}

const VALUE_TYPES = ['string', 'number', 'boolean', 'bigint', 'symbol'] as const;
type ValueTypeString = typeof VALUE_TYPES[number];

type ValueTypeMap = {
    string: string;
    number: number;
    boolean: boolean;
    bigint: bigint;
    symbol: symbol;
}

interface FieldDefinition<T extends ValueTypeString> {
    type: T;
}

type SchemaDefinition = {
    [key: string]: FieldDefinition<ValueTypeString> | SchemaDefinition;
}

type InferSchemaType<T extends SchemaDefinition> = {
    [K in keyof T]: T[K] extends FieldDefinition<infer U>
        ? ValueTypeMap[U]
        : T[K] extends SchemaDefinition
            ? InferSchemaType<T[K]>
            : never;
}

export class SchemaBuilder
{
    private _schema: SchemaDefinition;

    public constructor()
    {
        this._schema = {};
    }

    public field<N extends string, T extends ValueTypeString>(name: N, type: T): SchemaBuilder
    {
        this._schema[name] = {
            type
        }
        return this;
    }

    public object<N extends string, T extends SchemaDefinition>(name: N, type: T): SchemaBuilder
    {
        this._schema[name] = {
            type
        }
        return this;
    }
}

const builder = new SchemaBuilder();

const schema = builder
    .field("name", "string")
    .field("age", "number");