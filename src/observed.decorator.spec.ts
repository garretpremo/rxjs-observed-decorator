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

class TestSubject {
    // @ts-ignore
    @Observed({ type: 'subject' }) property: number;
    readonly property$!: Observable<number>;
}

class TestSubjectShorthand {
    // @ts-ignore
    @Observed('subject') property: number;
    readonly property$!: Observable<number>;
}

class TestClassNotInitialized implements Test {
    // @ts-ignore
    @Observed() property!: any;
    readonly property$!: Observable<any>;
}

class TestClassStatic {
    // @ts-ignore
    @Observed() static property = testValue1;
    static property$: Observable<number>;
}

class TestClassStatic2 {
    // @ts-ignore
    @Observed() static property = testValue1;
    static property$: Observable<number>;
}

abstract class TestClassStaticUninitialized {
    // @ts-ignore
    @Observed() static property;
    static property$: Observable<number>;
}

abstract class TestClassStaticUninitialized2 {
    // @ts-ignore
    @Observed() static property;
    static property$: Observable<number>;
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

    it('should provide correct Subject behavior when using type: subject', () => {
        const classA = new TestSubject();

        expect(classA.property).toBeNull();
        let spy = spyOn(console, 'log').and.stub();

        classA.property = testValue1;
        subscription.add(classA.property$.subscribe(value => console.log(value)));
        classA.property = testValue2;

        expect(spy).toHaveBeenCalledOnceWith(testValue2);
    });

    it('should provide correct Subject behavior when using \'subject\' shorthand', () => {
        const classA = new TestSubjectShorthand();

        expect(classA.property).toBeNull();
        let spy = spyOn(console, 'log').and.stub();

        classA.property = testValue1;
        subscription.add(classA.property$.subscribe(value => console.log(value)));
        classA.property = testValue2;

        expect(spy).toHaveBeenCalledOnceWith(testValue2);
    });

    it('should always return null from the property accessor when using type: subject', () => {
        const classA = new TestSubject();

        expect(classA.property).toBeNull();
        classA.property = testValue1;
        expect(classA.property).toBeNull();
        classA.property = testValue2;
        expect(classA.property).toBeNull();
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

    it('should work for classes with static members', () => {
        const checkStaticObservable = () => {
            subscription.add(TestClassStatic.property$.pipe(take(1))
                .subscribe(property => { expect(property).toEqual(TestClassStatic.property); }));
        };

        expect(TestClassStatic.property).toEqual(testValue1);
        checkStaticObservable();
    });

    it('should work for classes with static members when accessing the observable before initialization', () => {
        const checkStaticObservable = () => {
            subscription.add(TestClassStatic2.property$.pipe(take(1))
                .subscribe(property => { expect(property).toEqual(TestClassStatic2.property); }));
        };

        checkStaticObservable();
        expect(TestClassStatic2.property).toEqual(testValue1);
        checkStaticObservable();
    });

    it('should work for classes with static members that have not been initialized', () => {
        const checkStaticObservable = () => {
            subscription.add(TestClassStaticUninitialized.property$.pipe(take(1))
                .subscribe(property => { expect(property).toEqual(TestClassStaticUninitialized.property); }));
        };

        expect(TestClassStaticUninitialized.property).toBeNull();
        checkStaticObservable();
    });

    it('should work for classes with static members that have not been initialized when accessing the observable before initialization', () => {
        const checkStaticObservable = () => {
            subscription.add(TestClassStaticUninitialized2.property$.pipe(take(1))
                .subscribe(property => { expect(property).toEqual(TestClassStaticUninitialized2.property); }));
        };

        checkStaticObservable();
        expect(TestClassStaticUninitialized2.property).toBeNull();
        checkStaticObservable();
    });
});
