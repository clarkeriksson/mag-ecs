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
     * Holds the instances of {@link Component} for each {@link ClassConstructor}.
     * @private
     */
    private static readonly _statics: Map<ClassConstructor, Component> = new Map();

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
     * The class constructor of the component-type.
     * @private
     */
    public readonly ctor: ClassConstructor;

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
     * @param ctor
     * @param id
     * @private
     */
    private constructor(ctor: ClassConstructor, id: number)
    {
        this.ctor = ctor;
        this._id = id;
        this.signature = new Bitset();
        this.signature.set(id, true);
        this._instances = new SparseSet();

        Component._statics.set(ctor, this);
    }

    /**
     * Provides the unique {@link Component} instance associated with the class provided.
     * Automatically sets up a new instance if necessary.
     * @param ctor
     * @constructor
     */
    public static T(ctor: ClassConstructor): Component
    {
        let $static = Component._statics.get(ctor);
        return $static ?? this.addUnchecked(ctor);
    }

    /**
     * Gets the {@link SparseSet} of component-type instances.
     * Creates the {@link Component} instance if it does not exist.
     * @param ctor
     */
    public static getSet<T = any>(ctor: ClassConstructor<T>): SparseSet<T>
    {
        return Component.T(ctor)._instances as SparseSet<T>;
    }

    /**
     * Grabs a component-type instance for the given index from the {@link SparseSet} of instances.
     * Performs no check for existence, use with caution.
     * @param index
     * @param type
     */
    public static getUnchecked<T>(index: number, type: ClassConstructor<T>): T
    {
        return Component.getSet(type).getUnchecked(index);
    }

    /**
     * Sets the component-type {@link SparseSet} with the given value at the given index.
     * Creates the {@link Component} instance if it does not exist.
     * @param index
     * @param component
     */
    public static set(index: number, component: any): void
    {
        Component.getSet(component.constructor).add(index, component);
    }

    /**
     * Removes all component-type instances corresponding to the given index.
     * @param index
     */
    public static remove(index: number): boolean
    {
        let result = false;
        for (const component of Component._statics.values())
        {
            result ||= component._instances.remove(index) !== null;
        }
        return result;
    }

    /**
     * Creates a new instance of {@link Component} from the given constructor.
     * Does not check for uniqueness, use with caution.
     * @param ctor
     * @private
     */
    private static addUnchecked(ctor: any): Component
    {
        const id = Component._statics.size;

        const component = new Component(ctor, id);

        Component._statics.set(ctor, component);

        return component;
    }

    /**
     * Provides a unique {@link Bitset} from the provided component-types.
     * @param types
     */
    public static bitsetFromTypes(...types: any[]): Bitset
    {
        const result = new Bitset();
        for (const type of types)
        {
            result.set(Component.T(type).id, true);
        }
        return result;
    }

    /**
     * Provides a unique {@link Bitset} from the provided component-type instances.
     * @param components
     */
    public static bitsetFromComponents(...components: any[]): Bitset
    {
        const result = new Bitset();
        for (let i = 0; i < components.length; i++)
        {
            const component = components[i];
            result.set(Component.T(component.constructor).id, true);
        }
        return result;
    }

    /**
     * Clears the static instances.
     */
    public static dispose(): void
    {
        this._statics.clear();
    }
}