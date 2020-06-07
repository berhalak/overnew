import { inject, Container } from './index';

test("Simple register", () => {
	inject.reset();

	class ServiceA {
		methodA() {
			return "t";
		}
	}

	class ServiceB {
		constructor(private a = inject(ServiceA)) {

		}

		methodB() {
			return this.a.methodA() + "e";
		}
	}

	class NewService implements ServiceA {
		methodA() {
			return "T";
		}
	}

	class Model {
		constructor(private b = inject(ServiceB)) {

		}

		test() {
			return this.b.methodB() + "st";
		}
	}

	inject.when(ServiceA).create(NewService).asSingleton();
	inject.when(ServiceB).create(ServiceB);
	inject.when(Model).createSelf();

	const m = inject(Model);

	expect(m.test()).toBe("Test");

});

test("Simple register", () => {
	inject.reset();

	class Model {
		counter = 0;

		test() {
			return this.counter++;
		}
	}

	inject.when(Model).createSelf().asSingleton();

	const m = inject(Model);

	m.test(); // 1
	m.test(); // ?
	m.test(); // ?

	const m2 = inject(Model);
	m2.test();
	expect(m2.test()).toBe(4);

});


test("Register factory singleton", () => {
	inject.reset();

	class Model {
		counter = 0;

		test() {
			return this.counter++;
		}
	}

	inject.when(Model).execute(() => new Model());

	const m = inject(Model);

	m.test(); // ?
	m.test(); // ?
	m.test(); // ?

	const m2 = inject(Model);
	m2.test(); //?
	expect(m2.test()).toBe(1);

});

test("Register factory method", () => {
	inject.reset();

	class Model {
		counter = 0;

		test() {
			return this.counter++;
		}
	}

	inject.when(Model).execute(() => new Model()).asSingleton();

	const m = inject(Model);

	m.test(); // ?
	m.test(); // ?
	m.test(); // ?

	const m2 = inject(Model);
	m2.test(); //?
	expect(m2.test()).toBe(4);

});

test("Remote objects", async () => {
	inject.reset();

	class Model {
		counter = 0;

		async test() {
			return this.counter++;
		}
	}

	inject.when(Model).returnProxy();

	const second = new Container();

	let called = false;
	second.when(Model).execute(() => {
		called = true;
		return new Model();
	})

	async function proxy(type: string, method: string, args: any[]) {
		const result = await second.injectByName(type)[method](...args);
		return result;
	}

	inject.proxyTo(proxy);

	const m = inject(Model);

	expect(await m.test()).toBe(0);
	expect(called).toBeTruthy();
});

test("Remote objects", async () => {
	inject.reset();

	class Service {
		test() {
			return 1;
		}
	}

	class Service2 implements Service {
		test() {
			return 2;
		}
	}

	inject.when(Service).create(Service2);

	const s: Service = inject(Service);
	expect(s.test()).toBe(2);

	const override = inject.resolve(Service);

	const newService = new override();

	expect(newService.test()).toBe(2);
});