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

    const PositionComponent = Component.createClassComponent(Position, "Position");
    const VelocityComponent = Component.createClassComponent(Velocity, "Velocity");
    const NameComponent = Component.createValueComponent<string, "NameComponent">("string", "NameComponent");
    const AliasComponent = Component.createValueComponent<string, "AliasComponent">("string", "AliasComponent");
    const AgeComponent = Component.createValueComponent<number, "AgeComponent">("number", "AgeComponent");

    const world = new World();

    it("creates new entity with accessible components", () =>
    {
        const pos = new PositionComponent(1, 2);
        const vel = new VelocityComponent(3, 4);
        const name = new NameComponent("TestName");
        //const age = new AgeComponent(10);

        const entity = world.create(pos, vel, name);

        const desc = new QueryDefinition().withOnly(PositionComponent, VelocityComponent, NameComponent);

        const entityCount = world.entityCount(desc);

        expect(entityCount).equals(1);

        const [pos1, vel1, name1] = world.get([PositionComponent, VelocityComponent, NameComponent], entity);

        world.query(desc, (p, v, n) => {});

        expect(pos1.value).eq(pos.value);
        expect(pos1.type).eq(pos.type);
        expect(vel1.value).eq(vel.value);
        expect(vel1.type).eq(vel.type);
        expect(name1.value).eq(name.value);
        expect(name1.type).eq(name1.type);
    })
});