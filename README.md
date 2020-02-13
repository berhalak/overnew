# overnew
npm install overnew

Simple dependency injection library based on overriding new operator.

It is a perfect fit, if all what you need is a simple implementation switch.

Sample:

``` ts

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
Class.for(DefaultSingleton).use(ProperImplementation).singleton()

```

