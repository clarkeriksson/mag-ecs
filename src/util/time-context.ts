/// <reference types="../globals" />


/**
 * Holds useful time values and utility functions for interpreting them.
 * @class
 */
export class TimeContext
{
    /**
     * Global {@link TimeContext} instance.
     */
    public static shared: TimeContext = new TimeContext();

    /**
     * Flag indicating whether the context is currently updating.
     * @private
     */
    private _updating: boolean;

    /**
     * The value of {@link Date.now} at the start of the last processing period.
     * @private
     */
    private _lastTrackStartMS: number;

    /**
     * The value of {@link Date.now} at the end of the last processing period.
     * @private
     */
    private _lastTrackEndMS: number;

    /**
     * The value of {@link Date.now} at the start of this processing period.
     * @private
     */
    private _trackStartMS: number;

    /**
     * The amount of time between the start of the last processing period and the start of this processing period.
     * @private
     */
    private _trackElapsedMS: number;

    /**
     * The value of {@link Date.now} at the start of the last update.
     * @private
     */
    private _lastUpdateStartMS: number;

    /**
     * The value of {@link Date.now} at the end of the last update.
     * @private
     */
    private _lastUpdateEndMS: number;

    /**
     * The value of {@link Date.now} at the start of the current update.
     * @private
     */
    private _updateStartMS: number;

    /**
     * The amount of time between the start of last update and the start of this update.
     * @private
     */
    private _elapsedMS: number;

    /**
     * The accumulated processing time spent on the subject of this {@link TimeContext} during this update.
     * @private
     */
    private _trackedMS: number;

    /**
     * Creates an instance of {@link TimeContext}.
     */
    public constructor()
    {
        this._updating = false;

        const now = Date.now();

        this._lastTrackStartMS = now;
        this._lastTrackEndMS = now;
        this._trackStartMS = now;
        this._trackElapsedMS = 0;

        this._lastUpdateStartMS = now;
        this._lastUpdateEndMS = now;
        this._updateStartMS = now;
        this._elapsedMS = 0;

        this._trackedMS = 0;
    }

    /**
     * Callback to run at the start of whatever update process this {@link TimeContext} is describing.
     */
    public onStart(): void
    {
        this._updateStartMS = Date.now();
        this._elapsedMS = this._updateStartMS - this._lastUpdateStartMS;
    }

    /**
     * Runs {@link onStart} on the {@link TimeContext.shared} instance.
     */
    public static onStart(): void
    {
        TimeContext.shared.onStart();
    }

    /**
     * Callback to run at the end of whatever update process this {@link TimeContext} is describing.
     */
    public onEnd(): void
    {
        this._lastUpdateStartMS = this._updateStartMS;
        this._lastUpdateEndMS = Date.now();
    }

    /**
     * Runs {@link onEnd} on the {@link TimeContext.shared} instance.
     */
    public static onEnd(): void
    {
        TimeContext.shared.onEnd();
    }

    public onUpdateStart()
    {
        this._updating = true;
    }
}