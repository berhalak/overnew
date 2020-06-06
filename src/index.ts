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

	use<V>(type: Type<V>): ScopeSettings<T>
	use(type: T): ScopeSettings<T>
	use(arg: any): ScopeSettings<T> {
		if (typeof arg == 'function') {
			this.container.registerFactory(this.type, () => new arg());
		} else if (typeof arg == 'object') {
			this.container.registerFactory(this.type, () => arg);
		}
		return new ScopeSettings<T>(this.container, this.type);
	}

	useSelf(): ScopeSettings<T> {
		this.container.registerFactory(this.type, () => new this.type());
		return new ScopeSettings<T>(this.container, this.type);
	}

	asProxy() {
		this.container.registerAsProxy(this.type);
	}
}

function createProxy<T>(type: Type<T>, handler: ProxyHandler) {
	return new Proxy({}, {
		get: (target, message) => {
			return (...args: any[]) => {
				return handler(type.name, message as string, args);
			}
		}
	}) as any;
}

export type ProxyHandler = (type: string, method: string, args: any[]) => Promise<any>;

export class Container {
	registerAsProxy<T>(type: Type<T>) {
		this.proxies.add(type);
	}

	proxy(p: ProxyHandler) {
		this.proxyHandler = p;
	}

	private typeToFactory = new Map();
	private nameToType = new Map();
	private singletons = new Map();
	private instances = new Map();
	private proxies = new Set();
	private proxyHandler: ProxyHandler = null;

	registerFactory<T>(type: Type<T>, factory: () => T) {
		this.typeToFactory.set(type, factory);
		this.nameToType.set(type.name, type);
	}

	storeAsSingleton<T>(type: Type<T>) {
		this.singletons.set(type, 1);
	}

	reset() {
		this.typeToFactory.clear();
		this.singletons.clear();
		this.instances.clear();
	}

	inject<T>(what: Type<T> | string): T extends unknown ? any : T {

		let type = typeof what == 'function' ? what : this.nameToType.get(what);

		if (this.proxies.has(type)) {
			if (this.instances.has(type)) {
				return this.instances.get(type);
			}
			if (!this.proxyHandler) {
				throw "Proxy is not configured on this container";
			}
			const proxy = createProxy(type, this.proxyHandler);
			this.instances.set(type, proxy);
			return proxy;
		}

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

	return<T>(type: Type<T>) {
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


function inject<T>(type: Type<T> | string): T extends unknown ? any : T {
	return container().inject(type);
}

inject.return = function <T>(type: Type<T>): Settings<T> {
	return container().return(type);
}

inject.reset = function () {
	container().reset();
}

inject.proxyTo = function (proxy: (type: string, method: string, args: any[]) => Promise<any>) {
	container().proxy(proxy);
}

export { inject }