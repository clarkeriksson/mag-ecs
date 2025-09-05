/**
 * Non-nullish primitive types used in mag-ecs components.
 */
declare type ValuePrimitive = number | string | boolean;

/**
 * Array types of non-nullish primitives used in mag-ecs components.
 */
declare type ValueArray = number[] | string[] | boolean[];

/**
 * All primitive or array-primitive mag-ecs data types.
 */
declare type Value = ValuePrimitive | ValueArray;

/**
 * Transforms union types into a union type of each union member's array-type.
 * For example, 'string | number | Date' goes to 'string[] | number[] | Date[]'.
 */
declare type UnionToArray<T> = T extends any ? T[] : never;