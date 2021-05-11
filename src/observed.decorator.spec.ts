import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Observed } from './observed.decorator';

const testValue1 = 10;
const testValue2 = 25;
const testValue3 = 50;

class TestClass {
    // @ts-ignore
    @Observed() property = testValue1;
    readonly property$!: Observable<number>;
}

class TestClassNoDefaultValue {
    // @ts-ignore
    @Observed() property!: any;
    readonly property$!: Observable<any>;
}

describe('Observed decorator', () => {

    let subscription: Subscription;

    beforeEach(() => {
        subscription = new Subscription();
    });

    afterEach(() => {
        subscription.unsubscribe();
    });

    it('should hold distinct data for each class instance', () => {
        const classA = new TestClass();
        const classB = new TestClass();

        const checkObservable = (testClass: TestClass) => {
            subscription.add(testClass.property$.pipe(take(1))
                .subscribe(property => { expect(property).toEqual(testClass.property); }));
        };

        expect(classA.property).toEqual(testValue1);
        expect(classB.property).toEqual(testValue1);
        checkObservable(classA);
        checkObservable(classB);

        classA.property = testValue2;

        expect(classA.property).toEqual(testValue2);
        expect(classB.property).toEqual(testValue1);
        checkObservable(classA);
        checkObservable(classB);

        classB.property = testValue3;

        expect(classA.property).toEqual(testValue2);
        expect(classB.property).toEqual(testValue3);
        checkObservable(classA);
        checkObservable(classB);
    });

    it('should still work properly if no defaults are specified', () => {
        const classA = new TestClassNoDefaultValue();
        const classB = new TestClassNoDefaultValue();

        const checkObservable = (testClass: TestClassNoDefaultValue) => {
            subscription.add(testClass.property$.pipe(take(1))
                .subscribe(property => { expect(property).toEqual(testClass.property); }));
        };

        expect(classA.property).toBeUndefined();
        expect(classA.property$).toBeUndefined();
        expect(classB.property).toBeUndefined();
        expect(classB.property$).toBeUndefined();

        classA.property = testValue1;

        expect(classA.property).toEqual(testValue1);
        checkObservable(classA);
        expect(classB.property).toBeUndefined();
        expect(classB.property$).toBeUndefined();

        classB.property = testValue2;

        expect(classA.property).toEqual(testValue1);
        expect(classB.property).toEqual(testValue2);
        checkObservable(classA);
        checkObservable(classB);

        classA.property = testValue3;
        classB.property = testValue1;

        expect(classA.property).toEqual(testValue3);
        expect(classB.property).toEqual(testValue1);
        checkObservable(classA);
        checkObservable(classB);
    });
});
