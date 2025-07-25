import { Component } from '../core/component';
import { System } from '../core/system';
import { World } from '../core/world';
import { MagEvent } from '../core/mag-event';
import { QueryDefinition } from '../core/query-definition';
import { Bitset } from '../util/bitset';
import { SparseSet } from '../util/sparse-set';
import { SparseObjectSet } from '../util/sparse-object-set';
import { SparseBitSet } from '../util/sparse-bit-set';
import { SparseTagSet } from '../util/sparse-tag-set';
import { TimeContext } from '../util/time-context';

class Position {
    public x: number;
    public y: number;
    constructor(x?: number, y?: number) {
        this.x = x ?? (100 * Math.random());
        this.y = y ?? (100 * Math.random());
    }
}
const CPosition = Component.createClassComponent(Position, "CPosition");

class Velocity {
    public vx: number;
    public vy: number;
    constructor(vx?: number, vy?: number) {
        this.vx = vx ?? (40 * Math.random());
        this.vy = vy ?? (40 * Math.random());
    }
}
const CVelocity = Component.createClassComponent(Velocity, "CVelocity");

class Acceleration {
    public ax: number;
    public ay: number;
    constructor(ax?: number, ay?: number) {
        this.ax = ax ?? (5 * Math.random());
        this.ay = ay ?? (5 * Math.random());
    }
}

class PlacementRules {
    public voluminous: boolean;
    public passable: boolean;
    public tileable: boolean;
    public season: string;
    constructor() {
        this.voluminous = Math.random() > 0.5;
        this.passable = Math.random() > 0.5;
        this.tileable = Math.random() > 0.5;
        this.season = ["spring", "summer", "fall", "winder"][Math.floor(Math.random() * 3.99)];
    }
}
const CPlacementRules = Component.createStaticReadonlyClassComponent(PlacementRules, "CPlacementRules");

const CAcceleration = Component.createClassComponent(Acceleration, "Acceleration");

const CGameId = Component.createStaticReadonlyValueComponent<number, "CGameId">("CGameId");

const CSource = Component.createStaticValueComponent<string, "CSource">("CSource");

const COutdoorSeason = Component.createStaticValueComponent<string, "COutdoorSeason">("COutdoorSeason");

const CSeason = Component.createValueComponent<string, "CSeason">("CSeason");

const CBoolean = Component.createValueComponent<boolean, "CBoolean">("CBoolean", { isBoolean: true, isTag: false });

const CTag = Component.createValueComponent<true, "CTag">("CTag", { isTag: true, isBoolean: false });

export {
    CPosition,
    CVelocity,
    CAcceleration,
    CPlacementRules,
    CGameId,
    CSource,
    COutdoorSeason,
    CSeason,
    CBoolean,
    CTag,
}