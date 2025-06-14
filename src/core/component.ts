import {Bitset} from "../util/bitset";

/**
 * Type of class constructor.
 * @type
 */
export type ClassConstructor<T = any> = new (...args: any[]) => T;

export type ConstructorsOf<T> = { [K in keyof T]: ClassConstructor<T[K]> };

export class Component
{
    private static readonly _statics: Map<ClassConstructor, Component>;

    private readonly _id: number;

    public get id(): number { return this._id; }

    private _ctor: ClassConstructor;

    public signature: Bitset;

    private readonly _instances: SparseSet<any>;

    private constructor(ctor: ClassConstructor, id: number)
    {
        this._ctor = ctor;
        this._id = id;
        this.signature = new Bitset();
        this.signature.set(id, true);
        this._instances = new SparseSet();

        Component._statics.set(ctor, this);
    }

    public static T(ctor: ClassConstructor): Component
    {
        let $static = Component._statics.get(ctor);

        return $static ?? this.addUnchecked(ctor);
    }

    public static getSet<T = any>(ctor: ClassConstructor<T>): SparseSet<T>
    {
        return Component.T(ctor)._instances as SparseSet<T>;
    }

    public static getUnchecked<T>(index: number, type: ClassConstructor<T>): T
    {
        return Component.getSet(type).getUnchecked(index);
    }

    public static set(index: number, component: any): void
    {
        Component.getSet(component.constructor).add(index, component);
    }

    public static remove(index: number): boolean
    {
        let result = false;
        for (const component of Component._statics.values())
        {
            result ||= component._instances.remove(index) !== null;
        }
        return result;
    }

    private static addUnchecked(ctor: any): Component
    {
        const id = Component._statics.size;

        const component = new Component(ctor, id);

        Component._statics.set(ctor, component);

        return component;
    }

    public static bitsetFromTypes(...types: any[]): Bitset
    {
        const result = new Bitset();
        for (const type of types)
        {
            result.set(Component.T(type).id, true);
        }
        return result;
    }

    public static bitsetFromComponents(...components: any[]): Bitset
    {
        const result = new Bitset();
        for (const component of components)
        {
            result.set(Component.T(component.constructor).id, true);
        }
        return result;
    }
}