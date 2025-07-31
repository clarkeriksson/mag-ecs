// noinspection JSUnusedGlobalSymbols

/**
 * Represents a collection of bits identified by index.
 */
export class Bitset
{
    /**
     * A null bitset instance.
     */
    public static readonly null: Bitset;

    /**
     * The number of flags a {@link Bitset} represents.
     * @private
     */
    private static _flagCount: number;

    /**
     * The number of bits that make up a {@link Bitset}. This differs from the {@link _flagCount} due to this count
     * being rounded to the nearest multiple of 64 (8 bytes).
     * @private
     */
    private static _bitCount: number;

    /**
     * The number of bytes that make up a {@link Bitset}. This value is an alternate representation of
     * {@link _bitCount} and {@link _int8Count}.
     * @private
     */
    private static _byteCount: number;

    /**
     * The number of int8's that make up a {@link Bitset}. This value is an alternate representation of
     * {@link _bitCount} and {@link _byteCount}.
     * @private
     */
    private static _int8Count: number;

    /**
     * The array buffer holding the data of all {@link Bitset} instances as bytes.
     * @private
     */
    private static _memBuffer: ArrayBuffer;

    /**
     * The typed array view of the {@link _memBuffer}.
     * @private
     */
    private static _memArray: Uint8Array;

    /**
     * The number of spots currently in use or previously used in the {@link _memArray}.
     * @private
     */
    private static _memSize: number;

    /**
     * The array holding currently unused {@link _memBuffer} index values for reuse.
     * @private
     */
    private static _cemetery: number[];

    /**
     * Pool of unused {@link Bitset} instances for reuse.
     * @private
     */
    private static _instancePool: Bitset[];

    /**
     * The number of flags set to 'true' in this {@link Bitset}.
     * @private
     */
    private _setFlagCount: number;

    /**
     * Public view for the number of flags set to 'true' in this {@link Bitset}.
     */
    public get setFlagCount(): number
    {
        return this._setFlagCount;
    }

    /**
     * The number of {@link Bitset} representations in the {@link _memArray} before this one. It is important to note
     * that each {@link Bitset} representation has a length in the array of {@link _int8Count}.
     * @private
     */
    private readonly _memIndex: number;

    /**
     * The number of int8 instances that come before the data of this {@link Bitset}.
     * @private
     */
    private readonly _intIndex: number;

    /** Static init block. */
    static
    {
        Bitset.setFlagCount(32);
        Bitset.memReset();
        (Bitset as any).null = new Bitset();
    }

    /**
     * Creates an instance of {@link Bitset}.
     */
    constructor()
    {
        this._setFlagCount = 0;
        this._memIndex = Bitset.reserveIndex();
        this._intIndex = this._memIndex * Bitset._int8Count;
    }

    /**
     * Sets this {@link Bitset} instance's bit at the given index to the given value.
     * @param index The set index.
     * @param value The set value.
     */
    public set(index: number, value: boolean): void
    {
        const intIndex = this.getBitIntIndex(index);
        const bitOffset = index % 8;
        const mask = 1 << bitOffset;

        const wasSet = (Bitset._memArray[intIndex] & mask) !== 0;
        this._setFlagCount += (+value) - (-wasSet); // +/- coerces to num.

        // Resets the bit, then sets it to the new value.
        Bitset._memArray[intIndex] = (Bitset._memArray[intIndex] & ~mask) | (mask * (+value));
    }

    /**
     * Gets this {@link Bitset} instance's value at the given index.
     * @param index The bit index.
     */
    public get(index: number): boolean
    {
        const intIndex = this.getBitIntIndex(index);
        const bitOffset = index % 8;
        const mask = 1 << bitOffset;

        return (Bitset._memArray[intIndex] & mask) !== 0;
    }

    /**
     * Counts the number of set bits in an int8. Uses Brian Kernighan's algorithm.
     * @param int The int8.
     * @private
     */
    private countSetBitsInInt(int: number): number
    {
        let count = 0;
        while (int)
        {
            count++;
            int &= int - 1; // Clear the lowest set bit.
        }
        return count;
    }

    /**
     * Sets this {@link Bitset} to the result of a bitwise and with the given other {@link Bitset}.
     * @param other The other {@link Bitset}.
     */
    public and(other: Bitset): Bitset
    {
        this._setFlagCount = 0;

        for (let i = 0; i < Bitset._int8Count; i++)
        {
            Bitset._memArray[this._intIndex + i] &= Bitset._memArray[other._intIndex + i];
            this._setFlagCount += this.countSetBitsInInt(Bitset._memArray[this._intIndex + i]);
        }

        return this;
    }

    /**
     * Sets this {@link Bitset} to the result of a bitwise or with the given other {@link Bitset}.
     * @param other The other {@link Bitset}.
     */
    public or(other: Bitset): Bitset
    {
        this._setFlagCount = 0;

        for (let i = 0; i < Bitset._int8Count; i++)
        {
            Bitset._memArray[this._intIndex + i] |= Bitset._memArray[other._intIndex + i];
            this._setFlagCount += this.countSetBitsInInt(Bitset._memArray[this._intIndex + i]);
        }

        return this;
    }

    /**
     * Sets this {@link Bitset} to the result of a bitwise xor with the given other {@link Bitset}.
     * @param other The other {@link Bitset}.
     */
    public xor(other: Bitset): Bitset
    {
        this._setFlagCount = 0;

        for (let i = 0; i < Bitset._int8Count; i++)
        {
            Bitset._memArray[this._intIndex + i] ^= Bitset._memArray[other._intIndex + i];
            this._setFlagCount += this.countSetBitsInInt(Bitset._memArray[this._intIndex + i]);
        }

        return this;
    }

    /**
     * Sets this {@link Bitset} to the result of a bitwise not operation on itself.
     */
    public not(): Bitset
    {
        this._setFlagCount = 0;

        for (let i = 0; i < Bitset._int8Count; i++)
        {
            Bitset._memArray[this._intIndex + i] = ~Bitset._memArray[this._intIndex + i];
        }

        // Apply mask to the last byte to clear unused bits beyond _flagCount
        const lastByteIndex = Bitset._int8Count - 1;
        const bitsInLastByte = Bitset._flagCount % 8;
        if (bitsInLastByte !== 0)
        {
            const mask = (1 << bitsInLastByte) - 1;
            Bitset._memArray[this._intIndex + lastByteIndex] &= mask;
        }

        // Recalculate set flag count
        for (let i = 0; i < Bitset._int8Count; i++)
        {
            this._setFlagCount += this.countSetBitsInInt(Bitset._memArray[this._intIndex + i]);
        }

        return this;
    }

    /**
     * Sets all values in this {@link Bitset} to false.
     */
    public clear(): void
    {
        for (let i = 0; i < Bitset._int8Count; i++)
        {
            Bitset._memArray[this._intIndex + i] = 0;
        }
        this._setFlagCount = 0;
    }

    /**
     * Copies the value of this {@link Bitset} to the provided {@link Bitset}.
     * @param other The {@link Bitset} to copy to.
     */
    public copyTo(other: Bitset): void
    {
        for (let i = 0; i < Bitset._int8Count; i++)
        {
            Bitset._memArray[other._intIndex + i] = Bitset._memArray[this._intIndex + i];
        }
        other._setFlagCount = this._setFlagCount;
    }

    /**
     * Checks if this {@link Bitset} instance is a subset of the other {@link Bitset}.
     * @param other The other {@link Bitset}.
     */
    public isSubsetOf(other: Bitset): boolean
    {
        const checkSet = Bitset.and(this, other);

        if (checkSet.equals(this))
        {
            Bitset.return(checkSet);
            return true;
        }

        Bitset.return(checkSet);
        return false;
    }

    /**
     * Checks if this {@link Bitset} instance is a superset of the other {@link Bitset}.
     * @param other The other {@link Bitset}.
     */
    public isSupersetOf(other: Bitset): boolean
    {
        return other.isSubsetOf(this);
    }

    /**
     * Checks if this {@link Bitset} exactly equals the other {@link Bitset}.
     * @param other The other {@link Bitset}.
     */
    public equals(other: Bitset): boolean
    {
        for (let i = 0; i < Bitset._int8Count; i++)
        {
            if (Bitset._memArray[this._intIndex + i] !== Bitset._memArray[other._intIndex + i])
            {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if this {@link Bitset} overlaps with the other {@link Bitset}.
     * @param other The other {@link Bitset}.
     */
    public overlaps(other: Bitset): boolean
    {
        for (let i = 0; i < Bitset._int8Count; i++)
        {
            if ((Bitset._memArray[this._intIndex + i] & Bitset._memArray[other._intIndex + i]) !== 0)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the result of the bitwise and operation on the given {@link Bitset} instances in the order provided.
     * @param bitsets The list of {@link Bitset} instances.
     */
    public static and(...bitsets: Bitset[]): Bitset
    {
        if (bitsets.length === 0) return Bitset.rent();

        const result = Bitset.rent();
        bitsets[0].copyTo(result);

        for (let i = 0; i < bitsets.length; i++)
        {
            result.and(bitsets[i]);
        }

        return result;
    }

    /**
     * Returns the result of the bitwise or operation on the given {@link Bitset} instances in the order provided.
     * @param bitsets The list of {@link Bitset} instances.
     */
    public static or(...bitsets: Bitset[]): Bitset
    {
        const result = Bitset.rent();

        for (let i = 0; i < bitsets.length; i++)
        {
            result.or(bitsets[i]);
        }

        return result;
    }

    /**
     * Returns the result of the bitwise xor operation on the given {@link Bitset} instances in the order provided.
     * @param bitsets The list of {@link Bitset} instances.
     */
    public static xor(...bitsets: Bitset[]): Bitset
    {
        const result = Bitset.rent();

        for (let i = 0; i < bitsets.length; i++)
        {
            result.xor(bitsets[i]);
        }

        return result;
    }

    /**
     * Returns the index of the int8 that this {@link Bitset} instance's provided bit index resides within.
     * @param bitIndex The bit index.
     * @private
     */
    private getBitIntIndex(bitIndex: number = 0): number
    {
        return this._intIndex + Math.floor(bitIndex / 8);
    }

    /**
     * Calculates the static helper values given the desired number of flags to represent.
     * @param count
     */
    public static setFlagCount(count: number): void
    {
        Bitset._flagCount = count;
        Bitset._bitCount = Math.ceil(count / 8) * 8;
        Bitset._byteCount = Bitset._bitCount / 8;
        Bitset._int8Count = Bitset._byteCount;
    }

    /**
     * Resets the memory, cemetery, and pools.
     * @private
     */
    private static memReset(): void
    {
        Bitset._memBuffer = new ArrayBuffer(1024);
        Bitset._memArray = new Uint8Array(Bitset._memBuffer);
        Bitset._cemetery = new Array(1024);
        Bitset._instancePool = new Array(1024);
        Bitset._memSize = 0;
    }

    /**
     * Ensures the {@link _memBuffer} can hold the number of {@link Bitset} instances provided.
     * @param size The size in units of {@link Bitset}.
     * @private
     */
    private static ensureCapacity(size: number): void
    {
        const bitsetCount = Bitset._memArray.length / Bitset._int8Count;

        if (size <= bitsetCount) return;

        const doublings = Math.ceil(Math.log2(size / bitsetCount));
        const newCapacity = Bitset._memArray.length * Math.pow(2, doublings);

        const newBuffer = new ArrayBuffer(newCapacity);
        const newArray = new Uint8Array(newBuffer);

        newArray.set(Bitset._memArray, 0);

        Bitset._memBuffer = newBuffer;
        Bitset._memArray = newArray;
    }

    /**
     * Gets an index for use by a new {@link Bitset}.
     * @private
     */
    private static reserveIndex(): number
    {
        const reserved = Bitset._cemetery.pop();
        if (reserved !== undefined)
        {
            return reserved;
        }

        Bitset.ensureCapacity(Bitset._memSize + 1);
        const newReserved = Bitset._memSize;
        Bitset._memSize++;

        return newReserved;
    }

    /**
     * Rents a pooled {@link Bitset} instance for use after clearing it.
     */
    public static rent(): Bitset
    {
        const rented = Bitset._instancePool.pop();
        if (rented)
        {
            rented.clear();
            return rented;
        }

        return new Bitset();
    }

    /**
     * Returns or provides a {@link Bitset} instance to the internal pool.
     * @param bitset The returned {@link Bitset}.
     */
    public static return(bitset: Bitset): void
    {
        if (bitset && bitset !== Bitset.null)
        {
            Bitset._instancePool.push(bitset);
        }
    }

    /**
     * Returns a string representation of this {@link Bitset} instance.
     */
    public toString(): string
    {
        let string = "";
        for (let i = Bitset._flagCount - 1; i >= 0; i--)
        {
            string += this.get(i) ? "1" : "0";
        }
        return string || "0";
    }
}