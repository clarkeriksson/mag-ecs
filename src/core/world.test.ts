import { describe, it, expect } from "vitest";
import { World } from "./world";
import {Component} from "./component";
import {QueryDefinition} from "./query-definition";
import {SparseObjectSet} from "../util/sparse-object-set";

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

    const PositionComponent = Component.createReadonlyClassComponent(Position, "Position");
    const VelocityComponent = Component.createClassComponent(Velocity, "Velocity");
    const NameComponent = Component.createValueComponent<string, "NameComponent">("NameComponent");
    const AliasComponent = Component.createValueComponent<string, "AliasComponent">( "AliasComponent");
    const AgeComponent = Component.createReadonlyValueComponent<number, "AgeComponent">("AgeComponent");
    const ListComponent = Component.createReadonlyValueComponent<number[], "ListComponent">("ListComponent");

    const SSNComponent = Component.createStaticReadonlyValueComponent<number, "SSNComponent">("SSNComponent");
    const StaticPositionComponent = Component.createStaticClassComponent(Position, "StaticPosition");

    const world = new World();

    it("creates new entity with accessible components", () =>
    {
        const pos = new PositionComponent(1, 2);
        const vel = new VelocityComponent(3, 4);
        const name = new NameComponent("TestName");
        const list = new ListComponent([1, 4]);
        const ssn = new SSNComponent(12345678);
        const sPos = new StaticPositionComponent(3, 4);
        const age = new AgeComponent(21);
        //const age = new AgeComponent(10);

        const entity = world.create(world.base("none"), pos, vel, name, list, /*sPos, ssn,*/ age);

        const desc = new QueryDefinition()
            .withOnly(
                PositionComponent,
                VelocityComponent,
                NameComponent,
                ListComponent,
                StaticPositionComponent,
                SSNComponent,
                AgeComponent
            );

        const entityCount = world.entityCount(desc);

        expect(entityCount).equals(1);

        const [
            pos1,
            vel1,
            name1,
            list1,
            sPos1,
            ssn1,
            age1
        ] = world.get([
            PositionComponent,
            VelocityComponent,
            NameComponent,
            ListComponent,
            StaticPositionComponent,
            SSNComponent,
            AgeComponent],
            entity
        );

        world.entityQuery(desc, (
            e,
            p,
            v,
            n,
            l,
            sp,
            ssn,
            age) => {

            //l.value = [1, 2];
            //sp.value = new Position(1,2);
            v.value = new Velocity(4, 5);
        });

        expect(pos1.value).eq(pos.value);
        expect(pos1.type).eq(pos.type);
        expect(vel1.value).eq(vel.value);
        expect(vel1.type).eq(vel.type);
        expect(name1.value).eq(name.value);
        expect(name1.type).eq(name1.type);
    })
});