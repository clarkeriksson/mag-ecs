import { describe, it, bench } from "vitest";
import { World } from "./world";
import { Component } from "./component";
import { Query } from "./query";

describe("Integration", () => {

    const world = new World();

    class PositionData {
        x: number;
        y: number;
        constructor(x?: number, y?: number) {
            this.x = x ?? 10 * Math.random();
            this.y = y ?? 10 * Math.random();
        }
    }
    const Position = Component.fromClass<typeof PositionData>()("Position", false);

    class VelocityData {
        vx: number;
        vy: number;
        constructor(vx?: number, vy?: number) {
            this.vx = vx ?? 10 * Math.random();
            this.vy = vy ?? 10 * Math.random();
        }
    }
    const Velocity = Component.fromClass<typeof VelocityData>()("Velocity", false);

    const Name = Component.fromValue<string>()("Name", true);

    for (let i = 0; i < 100000; i++) {

        const newEntity = world.create();

        world.add(newEntity, Position, new PositionData());
        world.add(newEntity, Velocity, new VelocityData());
        world.add(newEntity, Name, "Clark");

        //console.log(Component.getQueryComponents([newEntity], [Position, Velocity, Name]));
    }

    const query = new Query().all(Position, Velocity, Name);

    bench("Packed iter", () => {

        world.run(query, (entity, [p, v, n]) => {

            //console.log(p.data);
            p.mutate(pos => {
                pos.x += 2;
                pos.y += 3;
            });

            v.mutate(vel => {
                vel.vx *= 1.02;
            })

        });

        //console.log(Position.get(0))

    })

})