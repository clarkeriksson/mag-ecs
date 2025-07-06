import { World } from "./world";
import { TimeContext } from "../util/time-context";

export type SystemContext = { time: TimeContext };
export type SystemCallback = (world: World, context: SystemContext) => void;

export class System
{
    /**
     * Array of registered systems, across all {@link World}(s).
     * @private
     */
    private static readonly _statics: Map<SystemCallback, System> = new Map();

    /**
     * Counter for generating unique ids.
     * @private
     */
    private static _idCounter: number = 0;

    /**
     * Unique {@link System} integer id.
     * @private
     */
    private readonly _id: number;

    /**
     * Unique {@link System} integer id.
     */
    public get id(): number { return this._id; }

    /**
     * The run priority, used to sort system updates.
     * Lower values run sooner. Equal values have no order guarantees between them.
     */
    public readonly runIndex: number;

    /**
     * The {@link System} callback function.
     * @private
     */
    private readonly _callback: SystemCallback;

    /**
     * Creates an instance of {@link System}.
     * @private
     */
    public constructor(callback: SystemCallback, runIndex?: number)
    {
        this._id = System._idCounter++;
        this.runIndex = runIndex ?? Number.MAX_VALUE;
        this._callback = callback;

        System._statics.set(callback, this);
    }

    /**
     * Runs this {@link System} on a given {@link World} for the given amount of time.
     * @param world
     */
    public run(world: World): void
    {
        this._callback(world, { time: TimeContext.shared });
    }
}