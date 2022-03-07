import { ObservedDecoratorOptions, ObservedDecoratorType } from './observed-decorator-options.interface';

/**
 * Decorator that marks a class property to be converted into a {@link Subject}, and reserves an additional property to act as that subject's {@link Observable}.
 * @description Marking a class property with `@Observed` will generate a hidden {@link Subject} _(a {@link BehaviorSubject} by default)_,
 *              and modify the getters and setters of that property to update/take from the {@link Subject}.
 *              An additional property will be created for the corresponding {@link Observable}, which is just the property name with  a `'$'` at the end.
 */
export function Observed(): PropertyDecorator;

/**
 * Decorator that marks a class property to be converted into a {@link Subject}, and reserves an additional property to act as that subject's {@link Observable}.
 * @description Marking a class property with `@Observed` will generate a hidden {@link Subject} _(a {@link BehaviorSubject} by default)_,
 *              and modify the getters and setters of that property to update/take from the {@link Subject}.
 *              An additional property will be created for the corresponding {@link Observable}, which is just the property name with  a `'$'` at the end.
 *
 * @param {ObservedDecoratorType} type - the {@link ObservedDecoratorType}, defines the type of subject to use:
 * <br/> * `'behavior'` - will create a {@link BehaviorSubject} _(default)_
 * <br/> * `'subject'` - will create a {@link Subject}. **NOTE** using `'subject'` will cause the parameter to never store a value in memory. Accessing the parameter will always return `null`.
 * <br/> * `'replay'` - will create a {@link ReplaySubject}
 */
export function Observed(type: ObservedDecoratorType): PropertyDecorator;

/**
 * Decorator that marks a class property to be converted into a {@link Subject}, and reserves an additional property to act as that subject's {@link Observable}.
 * @description Marking a class property with `@Observed` will generate a hidden {@link Subject} _(a {@link BehaviorSubject} by default)_,
 *              and modify the getters and setters of that property to update/take from the {@link Subject}.
 *              An additional property will be created for the corresponding {@link Observable}, which is just the property name with  a `'$'` at the end.
 *
 * @param {ObservedDecoratorOptions} options - an {@link ObservedDecoratorOptions} object
 * @param options.type - defines the type of subject to use:
 * <br/> * `'behavior'` - will create a {@link BehaviorSubject} _(default)_
 * <br/> * `'subject'` - will create a {@link Subject}. **NOTE** using `'subject'` will cause the parameter to never store a value in memory. Accessing the parameter will always return `null`.
 * <br/> * `'replay'` - will create a {@link ReplaySubject}
 * @param options.replayOptions options for a {@link ReplaySubject}, which are just its constructor arguments
 */
export function Observed(options: ObservedDecoratorOptions): PropertyDecorator;
