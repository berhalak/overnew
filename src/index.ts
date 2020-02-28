
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
const resolvers = new Map<Type, any>();

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
		// create override instance
		// this in turn call eventually this function
		// but we tested if this is overrideInstance
		return ensureSingleton(virtualType, () => {
			const instance = new overrideType(...args);
			return instance;
		});
	} else {
		return ensureSingleton(virtualType, () => {
			// create a original virtual type
			// as there is not mapping, or we need to provide ducktypeing extends
			const instance = new virtualType(...args);
			// set proper prototype
			if (overrideType)
				Object.setPrototypeOf(instance, overrideType.prototype);
			return instance;
		});
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
		const instance = create(baseType as any, args, this);
		return instance;
	} as any;
	constructorProxy.prototype = baseType.prototype;
	// for packer - as can't set name for now
	(constructorProxy as any).$type = baseType.name;
	// store original type in static field
	constructorProxy._proper = baseType;

	// copy all the static props
	Object.assign(constructorProxy, Object.assign({}, baseType));

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

	clear() {
		mappingsSingletons.delete(this.baseType);
		resolvers.delete(this.baseType);
		singletons.delete(this.baseType);
		mapping.delete(this.baseType);
		return this;
	}

	return<D>(instance: () => D): this
	return<D>(instance: D): this
	return(instance: any) {
		if (typeof instance != 'function') {
			mappingsSingletons.add(this.baseType);
			singletons.set(this.baseType, instance);
			resolvers.delete(this.baseType);
		} else {
			resolvers.set(this.baseType, instance);
		}
		return this;
	}
}

function ensureSingleton<T>(type: Type<T>, resolve: () => T): T {
	if (isSingleton(type)) {
		if (singletonExists(type)) {
			return singletons.get(type);
		}
	}

	const instance = resolve();

	if (isSingleton(type)) {
		singletons.set(type, instance);
	}

	return instance;
}

/**
 * Container and an api for manipulating overrides
 */
export class Class {
	static resolve<T extends new (...args: any[]) => any>(type: T):
		T extends new (...args: any[]) => infer R ? R : never {

		// first unwrap
		type = Class.unwrap(type) as any;

		return ensureSingleton(type, () => {
			// if has resolver - use this resolver
			if (resolvers.has(type)) {
				const instance = resolvers.get(type)();
				return instance;
			}

			// if was registered, use override
			const concrete = mapToOverride(type);
			if (concrete) {
				// this may fail, as not parameters where defined
				return new concrete();
			}
			throw new Error("Instance wasn't created")
		})
	}

	static create<T extends new (...args: any[]) => any>(type: T, ...args: ConstructorParameters<T>):
		T extends new (...args: any[]) => infer R ? R : never {

		// first unwrap
		type = Class.unwrap(type) as any;

		return ensureSingleton(type, () => {
			const concrete = mapToOverride(type);
			let instance: T = null;
			if (concrete) {
				instance = new concrete(...args);
			} else {
				if (resolvers.has(type)) {
					instance = resolvers.get(type)(...args);
				} else {
					instance = new type(...args);
				}
			}
			return instance;
		})
	}

    /**
     * Reset all settings and removes singletons, no previous declarations will work
     */
	static reset() {
		mapping.clear();
		singletons.clear();
		mappingsSingletons.clear();
		resolvers.clear();
	}

    /**
    * Removes all singletons
    */
	static delete() {
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
