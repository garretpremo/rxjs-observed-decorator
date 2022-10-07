import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { ObservedDecoratorOptions, ObservedDecoratorType } from './observed-decorator-options.interface';

abstract class ObservedDecorator {
    public static Observed(args?: ObservedDecoratorType | ObservedDecoratorOptions): PropertyDecorator {
        const options = ObservedDecorator.parseOptions(args);

        return function <T>(target: Object, key: string): void {
            const initialValue: T = target[key];

            // Since decorators are declarative, we have to define a setter that overwrites itself on the first set.
            // This allows the decorator to act on <i>each instance</i> of the class rather than acting as a static variable.
            Object.defineProperty(target, key, {
                get(): T {
                    return ObservedDecorator.initialGetValue.call(this, key, initialValue);
                },
                set(firstValue: T): void {
                    ObservedDecorator.initialSetValue.call(this, key, firstValue, options);
                },
                enumerable: true,
                configurable: true,
            });

            // When the @Observed property is either static or hasn't been initialized, and the user attempts to access the observable property,
            //  we need to generate the observable property by triggering the initial overwriting 'set', and then return it.
            Object.defineProperty(target, key + '$', {
                get(): Observable<T> {
                    return ObservedDecorator.initialGetObservable.call(this, key, initialValue);
                },
                enumerable: true,
                configurable: true,
            });
        }
    }

    private static parseOptions(args: ObservedDecoratorType | ObservedDecoratorOptions = 'behavior'): ObservedDecoratorOptions {
        return (typeof args === 'string')
            ? { type: args }
            : Object.assign({ type: 'behavior' }, args);
    }

    private static initialSetValue<T>(key: string, initialValue: T, options: ObservedDecoratorOptions): void {
        const subject = ObservedDecorator.initializeSubject(initialValue, options);
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

    private static initializeSubject<T>(firstValue: T, options: ObservedDecoratorOptions): Subject<T> {
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
    private static initialGetValue<T>(key: string, initialValue: T): T {
        this[key] = initialValue ?? null;
        return this[key];
    }

    private static initialGetObservable<T>(key: string, initialValue: T): Observable<T> {
        this[key] = initialValue ?? null;
        return this[key + '$'];
    }
}

export function Observed(): PropertyDecorator;
export function Observed(type: ObservedDecoratorType): PropertyDecorator;
export function Observed(options: ObservedDecoratorOptions): PropertyDecorator;

/**
 * `@Observed()` is a decorator that marks a class property to be converted into a {@link Subject},
 * and reserves an additional property to act as that subject's {@link Observable}.
 *
 * Marking a class property with `@Observed` will generate a hidden {@link Subject}, _(a {@link BehaviorSubject} by default)_.
 * This will also modify the getters and setters of that property to update/take from the {@link Subject}.
 * An additional property will be created on the object for the corresponding {@link Observable},
 * which is named as the property name with a `'$'` at the end.
 */
export function Observed(args?: ObservedDecoratorType | ObservedDecoratorOptions): PropertyDecorator {
    return ObservedDecorator.Observed(args);
}
