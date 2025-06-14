export class Bitset
{
    /**
     * The null {@link Bitset}.
     */
    public static null: Bitset = new Bitset();

    /**
     * Defines the default size in bytes for a new {@link Bitset}.
     * @private
     */
    private static _defaultSize: number = 64;

    /**
     * The buffer representation of the integers storing the {@link Bitset}.
     * @private
     */
    private _buffer: ArrayBuffer;

    /**
     * The array representation of the {@link Bitset}, where "bits" are 1-byte unsigned integers internally.
     * @private
     */
    private _bits: Uint8Array;

    /**
     * Provides the current length of the internal {@link Bitset} representation.
     */
    public get size(): number
    {
        return this._bits.length;
    }

    /**
     * Creates an instance of {@link Bitset}.
     * @constructor
     */
    public constructor()
    {
        this._buffer = new ArrayBuffer(Bitset._defaultSize);
        this._bits = new Uint8Array(this._buffer);
        this.clear();
    }

    /**
     * Sets the bit at the index to the given value.
     * @param index
     * @param value
     */
    public set(index: number, value: boolean): void
    {
        this.ensureCapacity(index + 1);
        this._bits[index] = value ? 0xf : 0x0;
    }

    /**
     * Sets this to the result of a bitwise "and" operation between this and the provided {@link Bitset}.
     * @param other
     */
    public and(other: Bitset): Bitset
    {
        for (let i = 0; i < this._bits.length; i++)
        {
            this._bits[i] &= (other._bits[i] ?? 0x0);
        }
        return this;
    }

    /**
     * Sets this to the result of a bitwise "or" operation between this and the provided {@link Bitset}.
     * @param other
     */
    public or(other: Bitset): Bitset
    {
        const maxLength = Math.max(this._bits.length, other._bits.length);

        this.ensureCapacity(maxLength);
        other.ensureCapacity(maxLength);

        for (let i = 0; i < maxLength; i++)
        {
            this._bits[i] |= other._bits[i];
        }

        return this;
    }

    /**
     * Sets this to the result of a bitwise "xor" operation between this and the provided {@link Bitset}.
     * @param other
     */
    public xor(other: Bitset): Bitset
    {
        const maxLength = Math.max(this._bits.length, other._bits.length);

        this.ensureCapacity(maxLength);
        other.ensureCapacity(maxLength);

        for (let i = 0; i < maxLength; i++)
        {
            this._bits[i] ^= other._bits[i];
        }

        return this;
    }

    /**
     * Sets this to the result of a bitwise "not" operation.
     */
    public not(): Bitset
    {
        for (let i = 0; i < this._bits.length; i++)
        {
            this._bits[i] = ~this._bits[i];
        }

        return this;
    }

    /**
     * Returns the result of iteratively performing bitwise "and" on the given Bitsets as a new {@link Bitset}.
     * @param sets
     */
    public static and(...sets: Bitset[]): Bitset
    {
        const setsLength = sets.length;
        if (setsLength === 0) throw new Error("Requires at least one input Bitset");

        let result = new Bitset();
        result.or(sets[0]);

        for (let i = 1; i < setsLength; i++)
        {
            result.and(sets[i]);
        }

        return result;
    }

    /**
     * Returns the result of iteratively performing bitwise "or" on the given Bitsets as a new {@link Bitset}.
     * @param sets
     */
    public static or(...sets: Bitset[]): Bitset
    {
        const setsLength = sets.length;
        if (setsLength === 0) throw new Error("Requires at least one input Bitset");

        let result = new Bitset();

        for (let i = 0; i < setsLength; i++)
        {
            result.or(sets[i]);
        }

        return result;
    }

    /**
     * Returns the result of iteratively performing bitwise "xor" on the given Bitsets as a new {@link Bitset}.
     * @param sets
     */
    public static xor(...sets: Bitset[]): Bitset
    {
        const setsLength = sets.length;
        if (setsLength === 0) throw new Error("Requires at least one input Bitset");

        let result = new Bitset();

        for (let i = 0; i < setsLength; i++)
        {
            result.xor(sets[i]);
        }

        return result;
    }

    /**
     * Checks if this {@link Bitset} is a superset of the provided one.
     * @param other
     */
    public isSupersetOf(other: Bitset): boolean
    {
        const andResult = Bitset.and(this, other);
        return Bitset.equal(other, andResult);
    }

    /**
     * Checks if this {@link Bitset} is a subset of the provided one.
     * @param other
     */
    public isSubsetOf(other: Bitset): boolean
    {
        const andResult = Bitset.and(this, other);
        return Bitset.equal(this, andResult);
    }

    /**
     * Checks if this {@link Bitset} is exactly equal to the provided one.
     * @param other
     */
    public equals(other: Bitset): boolean
    {
        return Bitset.equal(this, other);
    }

    /**
     * Checks the value equality of arbitrarily many {@link Bitset}(s).
     * @param sets
     */
    public static equal(...sets: Bitset[]): boolean
    {
        const xorResult = Bitset.xor(...sets);

        let result = true;
        for (let i = 0; i < xorResult._bits.length; i++)
        {
            result = xorResult._bits[i] === 0x0;
            if (!result) break;
        }

        return result;
    }

    /**
     * Sets all bit values to 0.
     */
    public clear(): void
    {
        this._bits.fill(0x0);
    }

    /**
     * Resets the bitset to the initial state.
     */
    public reset(): void
    {
        this._buffer = new ArrayBuffer(Bitset._defaultSize);
        this._bits = new Uint8Array(this._buffer);
        this.clear();
    }

    /**
     * Ensures this {@link Bitset} has at least the specified capacity in bytes.
     * @param bytes
     * @private
     */
    private ensureCapacity(bytes: number): void
    {
        if (this._buffer.byteLength >= bytes) return;

        const pow2Ceil = Math.ceil(Math.log2(bytes / this._buffer.byteLength));
        const newLength = this._buffer.byteLength * (2 ** pow2Ceil);

        const newBuffer = new ArrayBuffer(newLength);
        const newArray = new Uint8Array(newBuffer);

        newArray.set(this._bits, 0);

        this._buffer = newBuffer;
        this._bits = newArray;
    }
}