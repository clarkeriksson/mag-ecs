// noinspection JSUnusedGlobalSymbols

/**
 * Represents a collection of bits identified by index.
 */
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
     * Public access of the default size value.
     */
    public static get defaultSize(): number { return this._defaultSize; }

    /**
     * The buffer representation of the integers storing the {@link Bitset}.
     * @private
     */
    private _buffer: ArrayBuffer;

    /**
     * The array representation of the {@link Bitset}, where "bits" are 1-byte unsigned integers internally.
     * @private
     */
    private _bytes: Uint8Array;

    /**
     * The length of the bitset.
     * @private
     */
    private _size: number;

    /**
     * Provides the current length of the internal {@link Bitset} representation.
     */
    public get size(): number
    {
        return this._size;
    }

    /**
     * Provides the current last value of this {@link Bitset}.
     */
    public get last(): boolean
    {
        return this.get(this._size);
    }

    /**
     * The number of bits that are set to 1.
     * @private
     */
    private _setCount: number;

    /**
     * The number of bits set to 1.
     */
    public get setCount(): number
    {
        return this._setCount;
    }

    /**
     * Creates an instance of {@link Bitset}.
     * @constructor
     */
    public constructor()
    {
        this._buffer = new ArrayBuffer(Bitset._defaultSize);
        this._bytes = new Uint8Array(this._buffer);
        this._size = 0;
        this._setCount = 0;
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

        const byteIndex = (index / 8) | 0;
        const bitIndex = index % 8;
        const mask = 1 << bitIndex;

        const wasSet = (this._bytes[byteIndex] & mask) !== 0;
        this._setCount = (+value) - (+wasSet); // + signs are bool to num conversion

        // Resets the bit, then sets it to the new value.
        this._bytes[byteIndex] = (this._bytes[byteIndex] & ~mask) | (mask * (+value));
    }

    /**
     * Gets the bit at the index as a boolean.
     * No bounds checking performed.
     * @param index
     */
    public get(index: number): boolean
    {
        const byteIndex = (index / 8) | 0;
        const bitIndex = index % 8;
        const mask = 1 << bitIndex;

        return (this._bytes[byteIndex] & mask) !== 0;
    }

    public pop(): boolean
    {
        if (this._size <= 0) return false;

        this.set(this._size - 1, false);
        this._size -= 1;

        return true;
    }

    /**
     * Sets this to the result of a bitwise "and" operation between this and the provided {@link Bitset}.
     * This instance inherits the size of the other {@link Bitset}, if it is larger.
     * @param other
     */
    public and(other: Bitset): Bitset
    {
        const maxLength = Math.max(this._size, other.size);
        this.ensureCapacity(maxLength);

        this._setCount = 0;

        const maxByteIndex = ((maxLength / 8) | 0) + 1;
        for (let i = 0; i < maxByteIndex; i++)
        {
            const otherByte = i < other._bytes.length ? other._bytes[i] : 0x0;
            this._bytes[i] &= otherByte;

            this._setCount += this.countSetBitsInByte(this._bytes[i]);
        }

        return this;
    }

    /**
     * Sets this to the result of a bitwise "or" operation between this and the provided {@link Bitset}.
     * This instance inherits the size of the other {@link Bitset}, if it is larger.
     * @param other
     */
    public or(other: Bitset): Bitset
    {
        const maxLength = Math.max(this.size, other.size);
        this.ensureCapacity(maxLength);

        this._setCount = 0;

        const maxByteIndex = ((maxLength / 8) | 0) + 1;
        for (let i = 0; i < maxByteIndex; i++)
        {
            const otherByte = i < other._bytes.length ? other._bytes[i] : 0x0;
            this._bytes[i] |= otherByte;

            this._setCount += this.countSetBitsInByte(this._bytes[i]);
        }

        return this;
    }

    /**
     * Sets this to the result of a bitwise "xor" operation between this and the provided {@link Bitset}.
     * This instance inherits the size of the other {@link Bitset}, if it is larger.
     * @param other
     */
    public xor(other: Bitset): Bitset
    {
        const maxLength = Math.max(this.size, other.size);
        this.ensureCapacity(maxLength);

        this._setCount = 0;

        const maxByteIndex = ((maxLength / 8) | 0) + 1;
        for (let i = 0; i < maxByteIndex; i++)
        {
            const otherByte = i < other._bytes.length ? other._bytes[i] : 0x0;
            this._bytes[i] ^= otherByte;

            this._setCount += this.countSetBitsInByte(this._bytes[i]);
        }

        return this;
    }

    /**
     * Sets this to the result of a bitwise "not" operation.
     * The size of this instance remains the same.
     */
    public not(): Bitset
    {
        const maxByteIndex = ((this._size / 8) | 0) + 1;

        for (let i = 0; i < maxByteIndex - 1; i++)
        {
            this._bytes[i] = ~this._bytes[i];
        }

        // Last byte needs to be handled separate.
        const lastByteBitCount = this._size % 8;
        const mask = (1 << lastByteBitCount) - 1;
        this._bytes[maxByteIndex] = ~this._bytes[lastByteBitCount];
        this._bytes[maxByteIndex] &= mask;

        this._setCount = this._size - this._setCount;

        return this;
    }

    /**
     * Returns the result of iteratively performing bitwise "and" on the given Bitsets as a new {@link Bitset}.
     * The resulting {@link Bitset} inherits the size of the largest provided bitset.
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
     * The resulting {@link Bitset} inherits the size of the largest provided bitset.
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
     * The resulting {@link Bitset} inherits the size of the largest provided bitset.
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
     * All bitsets are considered supersets of the null bitset.
     * @param other
     */
    public isSupersetOf(other: Bitset): boolean
    {
        const andResult = Bitset.and(this, other);

        return Bitset.equal(other, andResult);
    }

    /**
     * Checks if this {@link Bitset} is a subset of the provided one.
     * The null bitset is considered a subset of every bitset.
     * @param other
     */
    public isSubsetOf(other: Bitset): boolean
    {
        const andResult = Bitset.and(this, other);

        return Bitset.equal(this, andResult);
    }

    /**
     * Checks if this {@link Bitset} shares any bits with the other.
     * @param other
     */
    public overlaps(other: Bitset): boolean
    {
        return Bitset.and(this, other).setCount !== 0;
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
        for (let i = 0; i < xorResult._size; i++)
        {
            result = xorResult._bytes[i] === 0x0;
            if (!result) break;
        }

        return result;
    }

    /**
     * Counts the number of set bits in a byte. Uses Brian Kernighan's algorithm.
     * @param byte
     * @private
     */
    private countSetBitsInByte(byte: number): number
    {
        let count = 0;
        while (byte) {
            count++;
            byte &= byte - 1; // Clear the lowest set bit
        }
        return count;
    }

    /**
     * Sets all bit values and the size to 0.
     */
    public clear(): void
    {
        this._bytes.fill(0x0);
        this._size = 0;
        this._setCount = 0;
    }

    /**
     * Resets the bitset to the initial state.
     */
    public reset(): void
    {
        this._buffer = new ArrayBuffer(Bitset._defaultSize);
        this._bytes = new Uint8Array(this._buffer);
        this.clear();
    }

    /**
     * Ensures this {@link Bitset} has at least the specified capacity in bits.
     * @param bits
     * @private
     */
    private ensureCapacity(bits: number): void
    {
        if (bits > this._size) this._size = bits;

        const requiredBytes = ((bits / 8) | 0) + 1;
        if (this._buffer.byteLength >= requiredBytes) return;

        const pow2Ceil = Math.ceil(Math.log2(requiredBytes / this._buffer.byteLength));
        const newLength = this._buffer.byteLength * (2 ** pow2Ceil);

        const newBuffer = new ArrayBuffer(newLength);
        const newArray = new Uint8Array(newBuffer);

        newArray.set(this._bytes, 0);

        this._buffer = newBuffer;
        this._bytes = newArray;
    }

    /**
     * Returns a string representation of this {@link Bitset}.
     * The least significant bit prints at the end of the string.
     */
    public toString(): string
    {
        let string = "";
        for (let i = this._size - 1; i >= 0; i--)
        {
            string += this.get(i) ? "1" : "0";
        }
        return string || "0";
    }
}