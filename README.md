# rxjs-observed-decorator
Adds a drop-dead simple decorator which ties a class variable to an RxJS Subject.



## Installation
```
npm install rxjs-observed-decorator --save
```

Requires you to add `"experimentalDecorators": true,` to `tsconfig.json`

```
// tsconfig.json
{
    "compilerOptions": {
        ...
        "experimentalDecorators": true,
        ...
    }
}
```

## Important Usage Notes
- **Do not** attempt to initialize the Observable property. The decorator handles that for you.
- If you are using `strict` mode, you can add `!` to your observable definitions to avoid errors.

```typescript
@Observed() property = '';
readonly property$!: Observable<string>;
```

## Angular Examples
A simple Service with an `@Observed()` property
```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
    
    @Observed() users: User[] = null;
    readonly users$!: Observable<User[]>;

    constructor(private http: HttpClient) {}

    getUsers() {
        this.http.get('users').subscribe(users => {
            
            // the property setter calls '.next()' behind the scenes
            this.users = users;

        });
    }

}
```

A simple Component that uses the service's Observable
```typescript
@Component({ ... })
export class UserListComponent implements OnInit {

    users$: Observable<User[]>;

    constructor(private userService: UserService) {
    }

    ngOnInit() {
        this.users$ = this.userService.users$;

        this.userService.getUsers();
    }
}
```

Component Template
```html
<ng-container *ngIf="(users$ | async) as users else loading">
    <div *ngFor="let user of users">...</div>
</ng-container>
<ng-template #loading>Loading Users...</ng-template>
```

## Generic Examples

### Behavior Subject (default)

```typescript
export class MyClass {

    @Observed() myProperty = 'initial value';
    
    // Observable property is automatically created.
    readonly myProperty$!: Observable<string>;

    constructor() {}
}

const instance = new MyClass();

instance.myProperty$.subscribe(value => console.log(value));

instance.myProperty = 'a'; 
instance.myProperty = 'b';
instance.myProperty = 'c';

// output:

// initial value
// a
// b
// c
```


### Subject

```typescript
export class MyClass {

    @Observed('subject') myNumber: number;
    readonly myNumber$!: Observable<number>;

    constructor() {}
}

const instance = new MyClass();

instance.myNumber = 1; 

instance.myNumber$.subscribe(value => console.log(value));

instance.myNumber = 2;
instance.myNumber = 3;

// output:

// 2
// 3
```


### Replay Subject

See [RxJS ReplaySubject](https://rxjs-dev.firebaseapp.com/api/index/class/ReplaySubject) for replayOptions
```typescript
interface Animal {
    mass: number;
    color: string;
}

export class MyClass {

    @Observed({ type: 'replay', replayOptions: {} }) 
    animal: Animal = null;
    
    readonly animal$!: Observable<Animal>;

    constructor() {}
}

const instance = new MyClass();

instance.animal = { mass: 50, color: 'orange' }; 

instance.animal$.subscribe(animal => console.log(`mass: ${ animal.mass }, color: ${ animal.color }`));

instance.animal = { mass: 60, color: 'green' };
instance.animal = { mass: 10, color: 'blue' };

// output:

// mass: 50, color: orange
// mass: 60, color: green
// mass: 10, color: blue
```

## Options

`Observed()` Decorator takes in an optional parameter for `options`. `options` can either be a `string` of the subject type, or an `Object` with more parameters as defined below.

```typescript
class MyClass {
    // using the subject type:
    @Observed('subject') propA = '';

    // using the options object:
    @Observed({ type: 'subject' }) propB = '';
}
```


| Option | Possible Values | Notes |
| - | - | - |
| type | • `'subject'`<br/> • `'replay'`<br/> • `'behavior'` | Default value is `'behavior'` |
| replayOptions | See [RxJS ReplaySubject](https://rxjs-dev.firebaseapp.com/api/index/class/ReplaySubject) | Should only be used with `type: 'replay'`|

The default value for `options` is `'behavior'`.
