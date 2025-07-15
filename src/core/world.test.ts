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

    const world = new World();

    it("creates new entity with accessible components", () =>
    {
        const name = new NameComponent("TestName");
        const alias = new AliasComponent("Alias");
        const age = new AgeComponent(10);

        const entity = world.create(name);

        const desc = new QueryDefinition().withOnly(NameComponent, AliasComponent, AgeComponent);

        const entityCount = world.entityCount(desc);

        expect(entityCount).equals(1);

        const [name1, alias1, age1] = world.get([NameComponent, AliasComponent, AgeComponent], entity);

        world.query(desc, (n, a, age) => {});

        expect(name1.value).eq(name.value);
        expect(name1.type).eq(name1.type);
    })
});