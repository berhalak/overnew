type Type<T = any> = new (...args: any[]) => T;


class ScopeSettings<T> {
	asSingleton() {
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

	create<V>(ctor: Type<V>): ScopeSettings<T> {
		this.container.registerOverride(this.type, ctor as any);
		return new ScopeSettings<T>(this.container, this.type);
	}

	return(instance: T): ScopeSettings<T> {
		this.container.registerFactory(this.type, () => instance);
		return new ScopeSettings<T>(this.container, this.type);
	}

	createSelf(): ScopeSettings<T> {
		this.container.registerFactory(this.type, () => new this.type());
		return new ScopeSettings<T>(this.container, this.type);
	}

	returnProxy() {
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

  constructor() {
    this.inject = this.inject.bind(this);
  }

	resolve<T>(type: Type<T>): Type<T> {
		if (this.typeToOverride.has(type)) {
			return this.typeToOverride.get(type);
		}
		return null;
	}
	registerAsProxy<T>(type: Type<T>) {
		this.proxies.add(type);
	}

	proxy(p: ProxyHandler) {
		this.proxyHandler = p;
	}

	private typeToFactory = new Map();
	private nameToType = new Map();
	private typeToOverride = new Map();
	private singletons = new Map();
	private instances = new Map();
	private proxies = new Set();
	private proxyHandler: ProxyHandler = null;

	registerOverride<T>(type: Type<T>, override: Type<T>) {
		this.typeToFactory.set(type, () => new override());
		this.typeToOverride.set(type, override);
		this.nameToType.set(type.name, type);
	}

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
		this.typeToOverride.clear();
	}

	injectByName(name: string) {
		return this.inject(this.nameToType.get(name));
	}

	inject<T>(what: Type<T>): T extends unknown ? any : T|null {
    try {
      stack.push(this);

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

      return null;
    } finally {
      stack.pop();
    }
	}

	when<T>(type: Type<T>|AbstractType<T>) {
		return new Settings<T>(this, type as any);
	}

  build<T extends new(...args: any[]) => any>(type: T, ...args: ConstructorParameters<T>): InstanceType<T> {
    try {
      stack.push(this);
      return new type();
    } finally {
      stack.pop();
    }
  }
}

type AbstractType<T> = abstract new (...args: any[]) => T;


var globalContainer: Container;

var stack: Container[] = [];

export function container(): Container {


  if (stack.length > 0) {
    return stack[stack.length - 1];
  }

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


function inject<T>(type: Type<T>|AbstractType<T>): T {
	return container().inject(type as any);
}

inject.when = function <T>(type: Type<T>): Settings<T> {
	return container().when(type);
}

inject.reset = function () {
	container().reset();
}

inject.resolve = function <T>(type: Type<T>): Type<T> {
	return container().resolve(type);
}

inject.proxyTo = function (proxy: (type: string, method: string, args: any[]) => Promise<any>) {
	container().proxy(proxy);
}

export { inject }