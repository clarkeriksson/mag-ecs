import {describe, bench, afterAll} from "vitest";
import {
    CPosition,
    CVelocity,
    CAcceleration,
    CPlacementRules,
    CGameId,
    CSource,
    COutdoorSeason,
    CSeason, CBoolean, CTag,
} from "./dummy-components";
import {World} from "../core/world";
import {QueryDefinition} from "../core/query-definition";
import {Component} from "../core/component";
import {System, SystemContext} from "../core/system";

describe("bench", () => {
    const world = new World();

    const staticEntity0 = world.createStatic(
        "StaticEntity0",
        new CPlacementRules(),
        new CGameId(0),
        new CSource("example/path/static-entity-0.png"),
        new COutdoorSeason("summer"),
    );

    const staticEntity1 = world.createStatic(
        "StaticEntity1",
        new CGameId(1),
        new CSource("example/path/static-entity-1.png"),
        new CPlacementRules(),
        new COutdoorSeason("spring"),
    );

    const staticEntity2 = world.createStatic(
        "StaticEntity2",
        new COutdoorSeason("winter"),
        new CSource("example/path/static-entity-2.png"),
        new CGameId(2),
        new CPlacementRules(),
    );

    const counts: Record<string, number> = {
        "summer": 0,
        "spring": 0,
        "winter": 0,
    };

    for (let i = 0; i < 100000; i++)
    {
        const whichBase = ["StaticEntity0", "StaticEntity1", "StaticEntity2"][Math.floor(Math.random() * 2.99)];
        counts[whichBase] += 1;
        const optionalComponents = [
            new CTag(true),
            (Math.random() > 0.5) ? new CVelocity() : undefined,
            (Math.random() > 0.8) ? new CAcceleration() : undefined,
            (Math.random() > 0.4) ? new CPosition() : undefined,
        ].filter(v => v !== undefined);
        const result = world.create(world.base(whichBase), ...optionalComponents);
    }

    // COutdoorSeason
    // CSource
    // CGameId
    // CPlacementRules
    // CTag
    // ?CVelocity
    // ?CAcceleration
    // ?CPosition

    const queryDef0 = new QueryDefinition()
        .withAll(CAcceleration, CPlacementRules, CGameId, COutdoorSeason, CSource);

    const queryDef1 = new QueryDefinition()
        .withAll(CPlacementRules);

    const queryDef2 = new QueryDefinition()
        .withAll(CGameId, CPosition);

    const queryDef3 = new QueryDefinition()
        .withAll(CTag);

    let count = 0;

    bench("first iteration", () => {
        world.query(queryDef0, (acc, a, b, season) =>
        {
            acc.value.ax += 0.1;
            if (season.value === 'winter') count++;
        });
    }, {
        warmupIterations: 100,
        iterations: 100,
    });
});