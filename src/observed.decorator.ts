import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { ObservedDecoratorOptions, ObservedDecoratorType } from './observed-decorator-options.interface';

/**
 * Decorator that marks a class property to be converted into a Subject, and reserves an additional property to act as that subject's observable.
 *
 * @usageNotes
 *
 * Marking a class property with `@Observed` will generate a hidden Subject (BehaviorSubject by default), and modify the getters and setters
 *  of that property to update/take from the Subject.
 *
 * An additional property will be created for the corresponding observable, which is just the property name with  a '$' at the end.
 *
 *  @param options - a configuration object.
 *      possible options:
 *          type: defines the type of subject to use
 *              - 'behavior' will create a BehaviorSubject (default)
 *              - 'subject' will create a Subject. **NOTE** using 'subject' will cause the parameter to never store a value in memory. Accessing the parameter will always return null.
 *              - 'replay' will create a ReplaySubject
 *          replayOptions: options for a ReplaySubject, which are just ReplaySubject's constructor arguments
 */
export function Observed(options: ObservedDecoratorType | ObservedDecoratorOptions = 'behavior'): PropertyDecorator {
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

namespace ObservedDecorator {
    export function initialSetValue<T>(key: string, initialValue: T, options: ObservedDecoratorType | ObservedDecoratorOptions): void {
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

    export function initializeSubject<T>(firstValue: T, options: ObservedDecoratorType | ObservedDecoratorOptions): Subject<T> {
        const type = (typeof options === 'string') ? options : options?.type;
        switch (type) {
            case 'behavior':
                return new BehaviorSubject(firstValue ?? null);
            case 'subject':
                return new Subject();
            case 'replay':
                const replayOptions = (options as ObservedDecoratorOptions)?.replayOptions;
                return new ReplaySubject(replayOptions?.bufferSize, replayOptions?.windowTime, replayOptions?.scheduler);
            default:
                return new BehaviorSubject(firstValue ?? null);
        }
    }

    /**
     * For initialized static members the initial `set` happens before the decorator is applied,
     * causing `initialValue` to be populated.
     *
     * In this case, just call the initial overriding `set`.
     */
    export function initialGetValue<T>(key: string, initialValue: T): T {
        this[key] = initialValue ?? null;
        return this[key];
    }

    export function initialGetObservable<T>(key: string, initialValue: T): Observable<T> {
        this[key] = initialValue ?? null;
        return this[key + '$'];
    }
}
