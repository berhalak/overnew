

export function override<T>(type: VType<T>) {
    return function (target: any) {
        Class.for(type).use(target);
    }
}

const map = new Map<Type, Type>();
const singletons = new Set<Type>();
const instances = new Map<Type, any>();

function create<T>(this: any, virtual: Type<T>, args: any[], context: any) {
    const deriv = map.get(virtual);
    if (deriv && deriv != context.constructor) {
        if (singletons.has(virtual)) {
            if (instances.has(virtual)) {
                return instances.get(virtual);
            }
        }
        const inst = new deriv(...args);
        if (singletons.has(virtual)) {
            return instances.set(virtual, inst);
        }
        return inst;
    }
    const baseInstance = new virtual(...args);
    Object.assign(context, baseInstance);
    return null;
}

export function singleton(baseType: any) {
    singletons.add(baseType);
    return virtual(baseType);
}

export function virtual(baseType: any) {
    const f: VType<any> = function (this: any, ...args: any[]) {
        return create(baseType, args, this);
    } as any;
    f.prototype = baseType.prototype;
    // for packer - as can't set name for now
    (f as any).$type = baseType.name;
    f._proper = baseType;
    return f;
}

type Type<T = any> = new (...args: any[]) => T;
type VType<T> = Type<T> & { _proper?: Type<T>, name?: string }

export class Class {

    static clear() {
        map.clear();
        instances.clear();
        singletons.clear();
    }

    static for<B>(virtualType: Type<B>) {
        const baseType = Class.unwrap(virtualType);
        return {
            use<D>(derivedType: Type<D>) {
                map.set(baseType, derivedType);
                return {
                    singleton() {
                        singletons.add(baseType);
                        return Class;
                    }
                }
            }
        }
    }

    static unwrap<T>(virtualType: Type<T>): Type<T> {
        return (virtualType as any)._proper ?? virtualType;
    }
}