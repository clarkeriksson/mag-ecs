// noinspection JSUnusedGlobalSymbols

import type { ClassDefinition } from "./component.js";

/**
 * A utility type describing a function taking in event data of type T and returning void.
 */
export type BarkListener<T> = (event: T) => void;

/**
 * Pseudo-static class used to access and automatically manage event-type information.
 * @class
 */
export class Bark
{
    /**
     * Holds the instances of {@link Bark} for each {@link ClassDefinition}.
     * @private
     */
    private static readonly _statics: Map<ClassDefinition, Bark> = new Map();

    /**
     * Holds the user-registered event run categories in a static array.
     * @private
     */
    private static readonly _runGroups: string[] = ["immediate"];

    /**
     * The internal representation of the {@link Bark} id.
     * @private
     */
    private readonly _id: number;

    /**
     * The {@link Bark} id, for when it is useful to identify event-types numerically.
     */
    public get id(): number { return this._id; }

    /**
     * The class constructor of the event-type;
     * @private
     */
    private readonly _ctor: ClassDefinition;

    /**
     * Holds events for this event-type as an array of typed data.
     * @private
     */
    private readonly _eventBus: any[];

    /**
     * Holds event listeners with immediate reaction for this event-type as an array of functions.
     * @private
     */
    private readonly _immediateListeners: Function[];

    /**
     * Holds event listeners under user-registered categories for this event-type as an array of functions.
     * @private
     */
    private readonly _listeners: Map<string, Function[]>;

    /**
     * Creates an instance of {@link Bark}.
     * @param ctor
     * @param id
     * @private
     */
    private constructor(ctor: ClassDefinition, id: number)
    {
        this._ctor = ctor;
        this._id = id;
        this._eventBus = [];
        this._immediateListeners = [];
        this._listeners = new Map();

        this._listeners.set("immediate", this._immediateListeners);

        Bark._statics.set(this._ctor, this);
    }

    /**
     * Processes events in the given group for this {@link Bark} instance.
     * @param group
     * @private
     */
    private run(group: string): boolean
    {
        const listeners = this._listeners.get(group);

        if (!listeners) return false;

        this._eventBus.forEach((event: any) =>
        {
            listeners.forEach(listener => listener(event));
        });

        return true;
    }

    /**
     * Provides the unique {@link Bark} instance associated with the class provided.
     * Automatically sets up a new instance if necessary.
     * @param ctor
     * @constructor
     */
    public static T(ctor: ClassDefinition): Bark
    {
        let $static = Bark._statics.get(ctor);
        return $static ?? this.addUnchecked(ctor);
    }

    /**
     * Creates a new instance of {@link Bark} from the given constructor.
     * Does not check for uniqueness, use with caution.
     * @param ctor
     * @private
     */
    private static addUnchecked(ctor: ClassDefinition): Bark
    {
        const id = this._statics.size;

        const event = new Bark(ctor, id);

        Bark._statics.set(ctor, event);

        return event;
    }

    /**
     * Emits an event of the type of the class constructor provided, with the given event data.
     * Runs any event listeners in the "immediate" run group as well.
     * @param ctor
     * @param event
     */
    public static emit<T>(ctor: ClassDefinition<T>, event: T): boolean
    {
        const magEvent = Bark.T(ctor);

        magEvent._eventBus.push(event);

        for (const callback of magEvent._immediateListeners)
        {
            callback(event);
        }

        return true;
    }

    /**
     * Adds the given run group to add existing instances of {@link Bark}.
     * @param group
     */
    public static registerRunGroup(group: string): boolean
    {
        if (this._runGroups.includes(group)) return false;

        let success = false;

        for (const [_, instance] of this._statics)
        {
            if (!instance._listeners.has(group))
            {
                instance._listeners.set(group, []);
                success = true;
            }
        }

        Bark._runGroups.push(group);
        return success;
    }

    /**
     * Processes all {@link Bark}(s) of any registered type for the run group given.
     * @param group
     */
    public static run(group: string): boolean
    {
        if (!Bark._runGroups.includes(group)) return false;

        for (const [_, instance] of this._statics)
        {
            instance.run(group);
        }

        return true;
    }

    /**
     * Registers a {@link Bark} listener to the given group.
     * If no group is provided, it registers to the "immediate" group.
     * @param ctor
     * @param listener
     * @param group
     */
    public static register<T>(ctor: ClassDefinition<T>, listener: BarkListener<T>, group: string = "immediate"): boolean
    {
        const instance = Bark.T(ctor);

        const listeners = instance._listeners.get(group);

        if (!listeners) return false;

        listeners.push(listener);

        return true;
    }
}