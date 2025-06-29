// noinspection JSUnusedGlobalSymbols

import {Bitset} from "../util/bitset";
import { SparseSet } from "../util/sparse-set";

/**
 * Pseudo-static class used to access and automatically manage component-type information.
 * @class
 */
export class Component
{
    /**
     * Holds the instances of {@link Component} for each {@link ComponentType}.
     * @private
     */
    private static readonly _statics: Map<ComponentType, Component> = new Map();

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
    public readonly type: ComponentType;

    /**
     * The {@link Bitset} representing this component-type.
     */
    public signature: Bitset;

    /**
     * The instances of this component-type. Members of the class this {@link Component} represents.
     * @private
     */
    private readonly _instances: SparseSet<any>;

    /**
     * Creates an instance of {@link Component}.
     * @param type
     * @private
     */
    private constructor(type: ComponentType)
    {
        this.type = type;
        this._id = Component._idCounter++;
        this.signature = new Bitset();
        this.signature.set(this._id, true);
        this._instances = new SparseSet();

        Component._statics.set(type, this);
    }

    /**
     * Provides the unique {@link Component} instance associated with the type provided.
     * Automatically sets up a new instance if necessary.
     * @param type
     * @constructor
     */
    public static T<T>(type: ComponentType<T>): Component
    {
        let $static = Component._statics.get(type);
        return $static ?? this.addUnchecked(type);
    }

    /**
     * Ensures a {@link Component} instance has been created for the given type and returns it's {@link ComponentType}
     * representation.
     * @param name
     */
    public static register<T>(name: string): ComponentType<T>
    {
        const type = Component.createComponentType<T>(name);
        Component.T(type);

        return type;
    }

    /**
     * Gets the {@link SparseSet} of component-type instances.
     * Creates the {@link Component} instance if it does not exist.
     * @param type
     */
    public static getSet<T>(type: ComponentType<T>): SparseSet<T>
    {
        return Component.T(type)._instances as SparseSet<T>;
    }

    /**
     * Gets a component instance for the given index from the {@link SparseSet} of instances.
     * Returns null if none are found.
     * @param index
     * @param type
     */
    public static get<T>(index: number, type: ComponentType<T>): T | null
    {
        return Component.getSet(type).get(index);
    }

    /**
     * Grabs a component-type instance for the given index from the {@link SparseSet} of instances.
     * Performs no check for existence, use with caution.
     * @param index
     * @param type
     */
    public static getUnchecked<T>(index: number, type: ComponentType<T>): T
    {
        return Component.getSet(type).getUnchecked(index);
    }

    /**
     * Sets the component-type {@link SparseSet} with the given value at the given index.
     * Creates the {@link Component} instance if it does not exist.
     * @param index
     * @param component
     * @param type
     */
    public static set<T>(index: number, component: T, type: ComponentType<T>): void
    {
        Component.getSet(type).add(index, component);
    }

    /**
     * Checks if an entity has a component of a given type.
     * @param index
     * @param type
     */
    public static has<T>(index: number, type: ComponentType<T>): boolean
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
    public static removeComponent<T>(index: number, type: ComponentType<T>): T | null
    {
        return Component.getSet(type).remove(index);
    }

    /**
     * Creates a new instance of {@link Component} from the given constructor.
     * Does not check for uniqueness, use with caution.
     * @param type
     * @private
     */
    private static addUnchecked(type: ComponentType): Component
    {
        return new Component(type);
    }

    /**
     * Provides a unique {@link Bitset} from the provided component-types.
     * @param types
     */
    public static bitsetFromTypes(...types: ComponentType[]): Bitset
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
    public static bitsetFromComponents(...components: TaggedComponent[]): Bitset
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
    public static getAllTypes(): ComponentType[]
    {
        return Array.from(Component._statics.keys());
    }

    /**
     * Gets the {@link Component} instance for a given type.
     * @param type
     */
    public static metadata<T>(type: ComponentType<T>): Component | null
    {
        return Component._statics.get(type) ?? null;
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
     * Creates a typed key for primitive {@link Component} types.
     * @param name
     * @private
     */
    public static createComponentKey<T>(name: string): ComponentKey<T>
    {
        return Symbol(name) as ComponentKey<T>;
    }

    /**
     * Returns the {@link ComponentType} of created type T with the provided name.
     * @param name
     */
    private static createComponentType<T>(name: string): ComponentType<T>
    {
        const pseudoConstructor = function(value?: T): T
        {
            return arguments.length > 0 ? value! : undefined as any;
        } as any;

        Object.defineProperty(pseudoConstructor, 'name', { value: name });
        pseudoConstructor.__isPrimitiveType = true;

        return pseudoConstructor as ComponentType<T>;
    }
}