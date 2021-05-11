import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { ObservedDecoratorOptions } from './observed-decorator-options.interface';

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
export const Observed = (options: ObservedDecoratorOptions = { type: 'behavior' }) => {
    return (target: any, key: string) => {

        // Since decorators are declarative, we have to define a setter that overwrites itself on the first set.
        // This allows the decorator to act on <i>each instance</i> of the class rather than acting as a static variable.
        Object.defineProperty(target, key, {
            set(firstValue: any) {

                let subject: Subject<any>;

                switch (options.type) {
                    case 'behavior':
                        subject = new BehaviorSubject(firstValue ?? null);
                        break;
                    case 'replay':
                        subject = new ReplaySubject(options?.replayOptions?.bufferSize, options?.replayOptions?.windowTime, options?.replayOptions?.scheduler);
                        break;
                    case 'subject':
                        subject = new Subject();
                        break;
                    default:
                        subject = new BehaviorSubject(firstValue ?? null);
                }

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
            enumerable: true,
            configurable: true,
        });
    };
};