import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
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
export const Observed = (options: ObservedDecoratorType | ObservedDecoratorOptions = 'behavior') => {
    return (target: any, key: string) => {

        const initialValue = target[key];

        // Since decorators are declarative, we have to define a setter that overwrites itself on the first set.
        // This allows the decorator to act on <i>each instance</i> of the class rather than acting as a static variable.
        Object.defineProperty(target, key, {
            set(firstValue: any) {

                const subject = ObservedDecorator.initializeSubject(firstValue, options);
                const observable$ = subject.asObservable();

                Object.defineProperty(this, key, {
                    get: () => {
                        if (subject instanceof BehaviorSubject) {
                            return subject.getValue();
                        }

                        return null;
                    },
                    set: value => subject.next(value),
                    enumerable: true,
                });

                Object.defineProperty(this, key + '$', {
                    get: () => observable$,
                    set: () => {},
                    enumerable: true,
                });
            },
            get() {
                // for initialized static members, the initial set happens before the decorator is applied, causing initialValue to be populated
                //  in this case, just call the initial overriding 'set'.
                if (typeof initialValue !== 'undefined') {
                    this[key] = initialValue;
                    return initialValue;
                }

                return null;
            },
            enumerable: true,
            configurable: true,
        });

        // When the @Observed property is either static or hasn't been initialized, and the user attempts to access the observable property,
        //  we need to generate the observable property by triggering the initial overwriting 'set', and then return it.
        Object.defineProperty(target, key + '$', {
            get() {
                if (typeof initialValue !== 'undefined') {
                    this[key] = initialValue;
                    return this[key + '$'];
                }

                this[key] = null;
                return this[key + '$'];
            },
            set: () => {},
            enumerable: true,
            configurable: true,
        });
    };
};

namespace ObservedDecorator {
    export function initializeSubject(firstValue: any, options: ObservedDecoratorType | ObservedDecoratorOptions): Subject<any> {
        switch (getType(options)) {
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

    export function getType(options: ObservedDecoratorType | ObservedDecoratorOptions): ObservedDecoratorType {
        return (typeof options === 'string')
            ? options
            : options?.type;
    }
}
