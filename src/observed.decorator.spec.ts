import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Observed } from './observed.decorator';

const testValue1 = 10;
const testValue2 = 25;
const testValue3 = 50;

interface Test {
    property: any;
    property$: Observable<any>;
}

class TestClass implements Test {
    // @ts-ignore
    @Observed() property = testValue1;
    readonly property$!: Observable<number>;
}

class TestClassNotInitialized implements Test {
    // @ts-ignore
    @Observed() property!: any;
    readonly property$!: Observable<any>;
}

describe('Observed decorator', () => {

    let subscription = new Subscription();

    const checkObservable = (testClass: Test) => {
        subscription.add(testClass.property$.pipe(take(1))
            .subscribe(property => { expect(property).toEqual(testClass.property); }));
    };

    beforeEach(() => {
        subscription = new Subscription();
    });

    afterEach(() => {
        subscription.unsubscribe();
    });

    it('should hold distinct data for each class instance', () => {
        const classA = new TestClass();
        const classB = new TestClass();

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

    it('should initialize undefined @Observed variables to null, and otherwise work as expected', () => {
        const classA = new TestClassNotInitialized();
        const classB = new TestClassNotInitialized();

        expect(classA.property).toBeNull();
        expect(classB.property).toBeNull();
        checkObservable(classA);
        checkObservable(classB);

        classA.property = testValue1;

        expect(classA.property).toEqual(testValue1);
        checkObservable(classA);

        expect(classB.property).toBeNull();
        checkObservable(classB);

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

    it('should initialize observables when attempting to access the observable before it has been initialized', () => {
        const classA = new TestClassNotInitialized();

        checkObservable(classA);
    });
});
