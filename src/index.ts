type Type<T = any> = new (...args: any[]) => T;

class ScopeSettings<T> {
	singleton() {
		this.container.storeAsSingleton(this.type);
		return this.container;
	}

	constructor(private container: Container, private type: Type<T>) {

	}
}

class Settings<T> {
	constructor(private container: Container, private type: Type<T>) {

	}

	execute(factory: () => T): ScopeSettings<T> {
		this.container.registerFactory(this.type, factory);
		return new ScopeSettings<T>(this.container, this.type);
	}

	create<V>(type: Type<V>): ScopeSettings<T>
	create(type: T): ScopeSettings<T>
	create(arg: any): ScopeSettings<T> {
		if (typeof arg == 'function') {
			this.container.registerFactory(this.type, () => new arg());
		} else if (typeof arg == 'object') {
			this.container.registerFactory(this.type, () => arg);
		}
		return new ScopeSettings<T>(this.container, this.type);
	}

	createSelf(): ScopeSettings<T> {
		this.container.registerFactory(this.type, () => new this.type());
		return new ScopeSettings<T>(this.container, this.type);
	}
}

export class Container {

	private typeToFactory = new Map();
	private singletons = new Map();
	private instances = new Map();

	registerFactory<T>(type: Type<T>, factory: () => T) {
		this.typeToFactory.set(type, factory);
	}

	storeAsSingleton<T>(type: Type<T>) {
		this.singletons.set(type, 1);
	}

	reset() {
		this.typeToFactory.clear();
		this.singletons.clear();
		this.instances.clear();
	}

	resolve<T>(type: Type<T>): T {
		if (this.instances.has(type)) {
			return this.instances.get(type);
		}

		const factory = this.typeToFactory.get(type);
		if (factory) {
			const instance = factory();
			if (this.singletons.has(type)) {
				this.instances.set(type, instance);
			}
			return instance;
		}
		throw `Type ${type.name} is not registered`
	}

	for<T>(type: Type<T>) {
		return new Settings<T>(this, type);
	}
}


var globalContainer: Container;

export function container(): Container {
	var window;
	var global;
	var globalThis;

	var proper: { __container: Container };

	if (typeof window == 'object') {
		proper = window as any;
	} else if (typeof globalThis != 'undefined') {
		proper = globalThis as any;
	} else if (typeof global != 'undefined') {
		proper = global as any;
	} else {
		if (!globalContainer)
			globalContainer = new Container();
		return globalContainer;
	}
	if (!proper.__container) {
		proper.__container = new Container();
	}
	return proper.__container;
}


function inject<T>(type: Type<T>): T {
	return container().resolve(type);
}

inject.for = function <T>(type: Type<T>): Settings<T> {
	return container().for(type);
}

inject.reset = function () {
	container().reset();
}

export { inject }