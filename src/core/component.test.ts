import { describe, expect, test } from "vitest";
import { Component, component } from "./component";
import type {
    ValidMagCtor
} from "../globals";

type IsMut = "Mut" | "Imu";
type TestNum = "1" | "2";
type TestCmpName<C extends string, M extends IsMut, N extends TestNum> = `Test${C}${M}${N}`;

function getTestName<C extends string, M extends IsMut, N extends TestNum>(name: C, mut: M, num: N): TestCmpName<C, M, N> {
    return "Test" + name + mut + num as TestCmpName<C, M, N>;
}

function getTestCmps<T extends ValidMagCtor, N extends string>(ctor: T, name: N): {
    mut1: Component<T, TestCmpName<N, "Mut", "1">, false>, 
    mut2: Component<T, TestCmpName<N, "Mut", "2">, false>,
    imu1: Component<T, TestCmpName<N, "Imu", "1">, true>,
    imu2: Component<T, TestCmpName<N, "Imu", "2">, true>,
} {
    return {
        mut1: component(ctor, getTestName(name, "Mut", "1")).mutable(),
        mut2: component(ctor, getTestName(name, "Mut", "2")).mutable(),
        imu1: component(ctor, getTestName(name, "Imu", "1")).immutable(),
        imu2: component(ctor, getTestName(name, "Imu", "2")).immutable(),
    }
}

const {
    mut1: str1Mut,
    mut2: str2Mut,
    imu1: str1Imu,
    imu2: str2Imu,
} = getTestCmps(String, "String");

const {
    mut1: num1Mut,
    mut2: num2Mut,
    imu1: num1Imu,
    imu2: num2Imu,
} = getTestCmps(Number, "Number");

const {
    mut1: boo1Mut,
    mut2: boo2Mut,
    imu1: boo1Imu,
    imu2: boo2Imu,
} = getTestCmps(Boolean, "Boolean");

type TestCmpJSON = { x: number, y: number, n: string, a: boolean };
class TestCmpClass {

    public x: number;
    public y: number;
    public name: string;
    public alive: boolean;

    public constructor(x?: number, y?: number, name?: string, alive?: boolean) {
        this.x = x ?? ((10 * Math.random()) | 0);
        this.y = y ?? ((10 * Math.random()) | 0);
        this.name = name ?? ("DefaultName" + ((10 * Math.random()) | 0));
        this.alive = alive ?? (Math.random() < 0.5);
    }

    toJSON(): TestCmpJSON {
        return {
            x: this.x,
            y: this.y,
            n: this.name,
            a: this.alive,
        }
    }

    static fromJSON(value: TestCmpJSON): TestCmpClass {
        return new TestCmpClass(value.x, value.y, value.n, value.a);
    }

}

const {
    mut1: cla1Mut,
    mut2: cla2Mut,
    imu1: cla1Imu,
    imu2: cla2Imu,
} = getTestCmps(TestCmpClass, "TestClass");

// =========================================//
// TESTING STARTS ==========================//
// =========================================//
describe("Component Class", () => {

    test("mutable string component is defined", () => expect(str1Mut).toBeDefined());
    test("additional mutable string component is defined", () => expect(str2Mut).toBeDefined());
    test("immutable string component is defined", () => expect(str1Imu).toBeDefined());
    test("additional immutable string component is defined", () => expect(str2Imu).toBeDefined());

    test("mutable number component is defined", () => expect(num1Mut).toBeDefined());
    test("additional mutable number component is defined", () => expect(num2Mut).toBeDefined());
    test("immutable number component is defined", () => expect(num1Imu).toBeDefined());
    test("additional immutable number component is defined", () => expect(num2Imu).toBeDefined());

    test("mutable boolean component is defined", () => expect(boo1Mut).toBeDefined());
    test("additional mutable boolean component is defined", () => expect(boo2Mut).toBeDefined());
    test("immutable boolean component is defined", () => expect(boo1Imu).toBeDefined());
    test("additional immutable boolean component is defined", () => expect(boo2Imu).toBeDefined());

    test("mutable class component is defined", () => expect(cla1Mut).toBeDefined());
    test("additional mutable class component is defined", () => expect(cla2Mut).toBeDefined());
    test("immutable class component is defined", () => expect(cla1Imu).toBeDefined());
    test("additional immutable class component is defined", () => expect(cla2Imu).toBeDefined());

});