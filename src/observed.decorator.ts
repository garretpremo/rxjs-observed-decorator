import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { ObservedDecoratorOptions, ObservedDecoratorType } from './observed-decorator-options.interface';

namespace ObservedDecorator {
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

    export function Observed(args?: ObservedDecoratorType | ObservedDecoratorOptions): PropertyDecorator {
        const options = parseOptions(args);

        return function <T>(target: Object, key: string): void {
            const initialValue: T = target[key];

            // Since decorators are declarative, we have to define a setter that overwrites itself on the first set.
            // This allows the decorator to act on <i>each instance</i> of the class rather than acting as a static variable.
            Object.defineProperty(target, key, {
                get(): T {
                    return initialGetValue.call(this, key, initialValue);
                },
                set(firstValue: T): void {
                    initialSetValue.call(this, key, firstValue, options);
                },
                enumerable: true,
                configurable: true,
            });

            // When the @Observed property is either static or hasn't been initialized, and the user attempts to access the observable property,
            //  we need to generate the observable property by triggering the initial overwriting 'set', and then return it.
            Object.defineProperty(target, key + '$', {
                get(): Observable<T> {
                    return initialGetObservable.call(this, key, initialValue);
                },
                enumerable: true,
                configurable: true,
            });
        }
    }

    function parseOptions(args: ObservedDecoratorType | ObservedDecoratorOptions = 'behavior'): ObservedDecoratorOptions {
        return (typeof args === 'string')
            ? { type: args }
            : Object.assign({ type: 'behavior' }, args);
    }

    function initialSetValue<T>(key: string, initialValue: T, options: ObservedDecoratorOptions): void {
        const subject = initializeSubject(initialValue, options);
        const observable$ = subject.asObservable();

        Object.defineProperty(this, key, {
            get: () => (subject instanceof BehaviorSubject) ? subject.getValue() : null,
            set: value => subject.next(value),
            enumerable: true,
        });

        Object.defineProperty(this, key + '$', {
            get: () => observable$,
            enumerable: true,
        });
    }

    function initializeSubject<T>(firstValue: T, options: ObservedDecoratorOptions): Subject<T> {
        switch (options?.type) {
            default:
            case 'behavior':
                return new BehaviorSubject(firstValue ?? null);
            case 'subject':
                return new Subject();
            case 'replay':
                const replayOptions = options?.replayOptions;
                return new ReplaySubject(replayOptions?.bufferSize, replayOptions?.windowTime, replayOptions?.scheduler);
        }
    }

    /**
     * For initialized static members the initial `set` happens before the decorator is applied,
     * causing `initialValue` to be populated.
     *
     * In this case, just call the initial overriding `set`.
     */
    function initialGetValue<T>(key: string, initialValue: T): T {
        this[key] = initialValue ?? null;
        return this[key];
    }

    function initialGetObservable<T>(key: string, initialValue: T): Observable<T> {
        this[key] = initialValue ?? null;
        return this[key + '$'];
    }
}

import Observed = ObservedDecorator.Observed;
export { Observed };
