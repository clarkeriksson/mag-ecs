import { describe, it, expect } from "vitest";
import { Component } from "./component";

describe("Component class", () =>
{
    it("should automatically create component type on first static access", () =>
    {
        Component.dispose();
        const type = Component.T(PosTest);
        expect(type).toBeDefined();
    });
});

class PosTest
{
    public x: number;
    public y: number;

    constructor(x: number, y: number)
    {
        this.x = x;
        this.y = y;
    }
}

class VelTest
{
    public vx: number;
    public vy: number;

    constructor(vx: number, vy: number)
    {
        this.vx = vx;
        this.vy = vy;
    }
}