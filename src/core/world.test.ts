import { describe, it, expect } from "vitest";
import { World } from "./world";
import {Component} from "./component";
import {QueryDefinition} from "./query-definition";

describe("World class", () =>
{
    class Position
    {
        public x: number;
        public y: number;
        constructor(x: number, y: number)
        {
            this.x = x;
            this.y = y;
        }
    }

    class Velocity
    {
        public vx: number;
        public vy: number;
        constructor(vx: number, vy: number)
        {
            this.vx = vx;
            this.vy = vy;
        }
    }

    const NameComponent = Component.createComponent<string, "NameComponent">("NameComponent");
    const AliasComponent = Component.createComponent<string, "AliasComponent">( "AliasComponent");
    const AgeComponent = Component.createComponent<number, "AgeComponent">("AgeComponent");
    const VolumeComponent = Component.createComponent<boolean, "VolumeComponent">("VolumeComponent");

    const TestComponent = Component.createComponent<{ name: string, alias: string }, "TestComponent">("TestComponent");

    const queryTemplate =
        {
            animal:
                {
                    age: AgeComponent,
                    name: NameComponent,
                    alias: AliasComponent,
                } as const,
            volume: VolumeComponent,
        } as const;

    const world = new World();

    it("creates new entity with accessible components", () =>
    {
        const name = new NameComponent("TestName");
        const alias = new AliasComponent("Alias");
        const test = new TestComponent({ name: "Clark", alias: "The Shark" });
        //const age = new AgeComponent(10);

        const entity = world.create(name);

        const desc = new QueryDefinition().withOnly(NameComponent, AliasComponent, TestComponent);

        const entityCount = world.entityCount(desc);

        expect(entityCount).equals(1);

        const [name1, alias1, test1] = world.get([NameComponent, AliasComponent, TestComponent], entity);

        world.query(desc, (p) => {});

        expect(name1.value).eq(name.value);
        expect(name1.type).eq(name1.type);
    })
});