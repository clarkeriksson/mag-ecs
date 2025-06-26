import { describe, it, expect } from "vitest";
import { Bitset } from "./bitset";

describe("Bitset class", () =>
{
    it("should correctly set a bit based on index", () =>
    {
        const bitset = new Bitset();

        let setValue = bitset.get(3);
        expect(setValue).equals(false);

        bitset.set(3, true);

        setValue = bitset.get(3);
        expect(setValue).equals(true);
    });

    it("should correctly clear a bit based on index", () =>
    {
        const bitset = new Bitset();

        bitset.set(5, true);

        let setValue = bitset.get(5);
        expect(setValue).equals(true);

        bitset.set(5, false);

        setValue = bitset.get(5);
        expect(setValue).equals(false);
    });

    it("should correctly expand capacity when needed", () =>
    {
        const bitset = new Bitset();

        // @ts-ignore
        const initialLength = bitset._bits.length;

        // @ts-ignore
        const defaultCapacity = Bitset._defaultSize;

        expect(initialLength).equals(defaultCapacity);

        bitset.set(initialLength + 10, true);

        // @ts-ignore
        const finalLength = bitset._bits.length;

        expect(finalLength).above(initialLength);
    });
});