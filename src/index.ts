
/**
 * Overrides base class constructor with derived class constructor
 */
export function override(type: any) {
	return function (target: any) {
		Class.for(type).use(target);
	}
}

const mapping = new Map<Type, Type>();
const mappingsSingletons = new Set<Type>();
const singletons = new Map<Type, any>();

function mapToOverride<T>(virtual: Type<T>): Type<T> {
	return mapping.get(virtual);
}

function isSingleton(virtual: Type) {
	return mappingsSingletons.has(virtual);
}

function singletonExists(virtual: Type) {
	return singletons.has(virtual);
}

type Context<T> = T & { constructor: Type<T> }

function create<T>(this: any, virtualType: Type<T>, args: any[], context: Context<T>) {
	// get override type
	const overrideType = mapToOverride(virtualType);

	// test if create was called as part of override instance creation
	// so when code is executed as new (class Extend extends Base {})() 
	// we can be in a moment when base class is being created, but this points to Extend
	// we don't wont to create a base class as this will result in infinite loop
	const isOverrideInstance = overrideType == context.constructor;

	if (overrideType && !isOverrideInstance) {
		if (isSingleton(virtualType)) {
			if (singletonExists(virtualType)) {
				return singletons.get(virtualType);
			}
		}

		// create override instanse
		// this in turn call eventually this function
		// but we tested if this is overrideInstance
		const instance = new overrideType(...args);
		if (isSingleton(virtualType)) {
			return singletons.set(virtualType, instance);
		}
		return instance;
	} else {

		if (isSingleton(virtualType)) {
			if (singletonExists(virtualType)) {
				const value = singletons.get(virtualType);
				return value;
			}
		}

		// create a original virtual type
		// as there is not mapping, or we need to provide ducktypeing extends
		const baseInstance = new virtualType(...args);
		// return plain object, as prototype and constructor will be set by engine
		const instance = Object.assign(context, baseInstance);
		if (isSingleton(virtualType)) {
			return singletons.set(virtualType, instance);
		}
		return instance;
	}
}

/**
 * Allows class to be overridden using override attribute
 * and declares this class as singleton.
 */
export function singleton(baseType: any) {
	mappingsSingletons.add(baseType);
	return virtual(baseType);
}

/**
 * Allows class to be overridden using override attribute
 * or using verbose call to Class.for(Base).use(Derive)
 */
export function virtual(baseType: any): any {
	const constructorProxy: VType<any> = function (this: any, ...args: any[]) {
		return create(baseType as any, args, this);
	} as any;
	constructorProxy.prototype = baseType.prototype;
	// for packer - as can't set name for now
	(constructorProxy as any).$type = baseType.name;
	// store original type in static field
	constructorProxy._proper = baseType;
	return constructorProxy;
}

type Type<T = any> = new (...args: any[]) => T;
type VType<T> = Type<T> & { _proper?: Type<T>, name?: string }

class Settings<V, D> {
	constructor(private baseType: Type<V>, private virtualType: Type<D>) {

	}

	use<D>(derivedType: Type<D>) {
		mapping.set(this.baseType, derivedType);
		return this;
	}


	singleton() {
		mappingsSingletons.add(this.baseType);
		return Class;
	}

	return<D>(instance: D) {
		mappingsSingletons.add(this.baseType);
		singletons.set(this.baseType, instance);
		return Class;
	}
}

/**
 * Container and an api for manipulating overrides
 */
export class Class {

    /**
     * Reset all settings and removes singletons, no previous declarations will work
     */
	static reset() {
		mapping.clear();
		singletons.clear();
		mappingsSingletons.clear();
	}

    /**
    * Removes all singletons
    */
	static clear() {
		singletons.clear();
	}

    /**
    * Manual register an override for a base class
    */
	static for<B>(virtualType: Type<B>) {
		const baseType = Class.unwrap(virtualType);
		return new Settings(baseType, virtualType);
	}

    /**
     * Returns an base class (virtual one) from virtual declaration
     */
	static unwrap<T>(virtualType: Type<T>): Type<T> {
		return (virtualType as any)._proper ?? virtualType;
	}
}