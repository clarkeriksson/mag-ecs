// noinspection JSUnusedGlobalSymbols

import {
    IS_CLASS,
    IS_VALUE,
    IS_BOOLEAN,
    IS_TAG,
    IS_READONLY,
} from "../const/symbols.js";

import { Bitset } from "../util/bitset.js";
import { SparseSet } from "../util/sparse-set.js";

export interface ClassDefinition<T = any> {
    new(...args: any[]): T;
}

export type CmpCtor<C extends Component> =
    C extends Component<infer Type, string, any>
        ? Type
        : never;

export type CmpName<C extends Component> =
    C extends Component<any, infer Name, any>
        ? Name
        : never;

export type CmpReadonly<C extends Component> =
    C extends Component<any, string, infer Readonly>
        ? Readonly
        : never;

export class Accessor<T extends Component = Component> {
    public entity = -1;
    public readonly data!: CtorReadData<CmpCtor<T>, CmpReadonly<T>>;
    public component!: T;

    public mutate(mutator: (current: CtorMutArgData<CmpCtor<T>, CmpReadonly<T>>) => CtorMutArgData<CmpCtor<T>, CmpReadonly<T>> | void): void {
        this.component.mutate(this.entity, mutator);
    }
}

/**
 * Class used to access and automatically manage component-type information.
 * @class
 */
export class Component<
    Type extends ValidMagCtor = ValidMagCtor, 
    Name extends string = string, 
    Readonly extends boolean = boolean
> {

    private static _nextId: number = 0;

    private static _bitsetCache: Map<Component<any, string, boolean>[], Bitset> = new Map();

    private readonly [IS_CLASS]: boolean;
    private readonly [IS_VALUE]: boolean;
    private readonly [IS_BOOLEAN]: boolean;
    private readonly [IS_TAG]: boolean;

    private readonly [IS_READONLY]: Readonly;

    private readonly _name: Name;
    private readonly _id: number;
    private readonly _idBitset: Bitset;

    private readonly _constructor?: ClassDefinition;

    public get id(): number { return this._id; }

    private readonly _store: SparseSet<CtorReadData<Type, Readonly>>;

    private constructor({
        isTagType,
        isReadonly,
        name,
        ctor,
                        }: {
        isTagType: boolean;
        isReadonly: Readonly;
        name: Name;
        ctor?: ClassDefinition;
    }) {

        this[IS_CLASS] = true;
        this[IS_VALUE] = true;
        this[IS_BOOLEAN] = true;
        this[IS_TAG] = isTagType;
        this[IS_READONLY] = isReadonly;
        this._name = name;

        this._store = new SparseSet<CtorReadData<Type, Readonly>>();

        this._id = Component._nextId;
        Component._nextId++;

        this._idBitset = new Bitset();
        this._idBitset.set(this._id, true);

        this._constructor = ctor;

    }

    public static fromClass<T extends ValidMagCtor, N extends string, R extends boolean>({ ctor, name, readonly }: { ctor: T, name: N, readonly: R }) {

        return new Component<T, N, R>({
            isTagType: false,
            isReadonly: readonly,
            name: name,
            ctor,
        });

    }

    // public static fromValue<T extends Value>() {

    //     return <N extends string, R extends boolean>({ name, readonly }: { name: N, readonly: R }) => {

    //         return new Component<T, N, R>({
    //             isTagType: false,
    //             isReadonly: readonly,
    //             name: name,
    //         });

    //     }

    // }

    public get(entity: number): CtorReadData<Type, Readonly> | undefined {

        return this._store.get(entity);

    }

    public __get(entity: number): CtorReadData<Type, Readonly> {

        return this._store.__get(entity)!;

    }

    private _set(entity: number, value: CtorReadData<Type, Readonly>): void {

        this._store.set(entity, value);

    }

    public add(entity: number, value: CtorReadData<Type, Readonly>): boolean {

        return this._store.add(entity, value);

    }

    public remove(entity: number): boolean {

        const removed = this._store.remove(entity);
        return removed !== undefined;

    }

    public mutate(entity: number, mutator: Readonly extends true ? never : (current: CtorMutArgData<Type, Readonly>) => CtorMutArgData<Type, Readonly> | void): void {

        const current = this.get(entity) as CtorReadData<Type, false>;

        if (!current) return;

        const newValue = mutator(current);

        if (newValue !== undefined) {

            this._store.set(entity, newValue as CtorReadData<Type, Readonly>);

        }

    }

    public static bitsetFromTypes(...types: Component[]): Bitset {

        if (Component._bitsetCache.has(types)) {

            return Component._bitsetCache.get(types)!;

        }

        return Bitset.or(...types.map(type => type._idBitset));

    }

    public static getQueryComponents(entities: number[], types: (readonly Component[])): CtorReadData<any, any>[] {

        const entitiesLength = entities.length;
        const typesLength = types.length;
        const result = new Array(entitiesLength * typesLength);

        for (let j = 0; j < typesLength; j++) {

            const type = types[j];

            type._store.__getBatch(entities, result, typesLength, j);

        }

        return result;

    }

}

export function component<N extends string>(name: N) {

    return {

        class: <T extends ValidMagCtor = ValidMagCtor>(ctor: T) => {

            return {

                immutable: () => Component.fromClass({ ctor, name, readonly: true }),
                mutable: () => Component.fromClass({ ctor, name, readonly: false }),

            }

        }

    }

}

class TestClass {
    prop: string;
    constructor(prop: string) {
        this.prop = prop;
    }
    toJSON() {
        return { prop: this.prop };
    }
    static fromJSON(json: { prop: string }) {
        return new TestClass(json.prop);
    }
}

var test = component("Name").class(Boolean).immutable();
var testAcc = new Accessor<typeof test>();
testAcc.component = test;
testAcc.entity = 1;
(testAcc.data as any) = new TestClass("Hello");

testAcc.mutate((current) => {
    current = false;
})