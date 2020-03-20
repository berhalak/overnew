[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/berhalak/overnew) 

# overnew

npm install overnew

Simple dependency injection library based on overriding new operator.

It is a perfect fit, if all what you need is a simple implementation switch.

Sample:

``` ts

// Simple usage using default parameter

class ServiceA {
    methodA(){
        return "t";
    }
}

class ServiceB {
    constructor(private a = inject(ServiceA)){

    }

    methodB(){
        return this.a.methodA() + "e";
    }
}

class NewService implements ServiceA {
    methodA(){
        return "T";
    }
}

class Model {
    constructor(private b = inject(ServiceB)){

    }

    test(){
        return this.b.methodB() + "st";
    }
}

inject.for(ServiceA).use(NewService);
inject.for(ServiceB).use(ServiceB);

const m = new Model();

expect(m.test()).toBe("Test");

----

@virtual
class BaseClass {
    hello() {
        return "base";
    }
}

// implement base class
@override(BaseClass)
class DeriveClass implements BaseClass {
    hello() {
        return "derive";
    }
}

// or even extend 

@override(BaseClass)
class DeriveClass extends BaseClass {
    hello() {
        return "derive";
    }
}

expect(new BaseClass().hello()).toBe("derive");
// new BaseClass() is now a call to new DeriveClass

// to access baseClass - simple unwrap base class constructor
expect(new Class.unwrap(BaseClass)().hello()).toBe("base");

// other options

// same as virtual, but defines a global singleton
@singleton
class DefaultSingleton {

}

// manual registration

class ProperImplementation implements DefaultSingleton {}
Class.for(DefaultSingleton).use(ProperImplementation);

// or if virtual attribute was used, but we want to override with a singleton instance
Class.for(DefaultSingleton).use(ProperImplementation).singleton();

// don't want to use attributes ? use Class as a static container

// you need to define interfaces as classes
class MyInterface {
    hello() {...}
}

class MyPlugin implements /* extends */ MyInteface {
    hello() {...}
}

Class.for(MyInterface).use(MyPlugin)
Class.for(MyInterface).use(() => new MyPlugin()));
Class.for(MyInterface).use(new MyPlugin()) // singleton

// anywhere in your code
Class.resolve(MyInterface);

// need to change registration - completely reset container
Class.reset();

// or only for single type
Class.for(MyInterface).clear();

// or just remove all singletons
Class.delete();

```

