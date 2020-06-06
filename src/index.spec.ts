import { inject } from './index';

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

	inject.for(ServiceA).create(NewService).singleton();
	inject.for(ServiceB).create(ServiceB);
	inject.for(Model).createSelf();

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

	inject.for(Model).createSelf().singleton();

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

	inject.for(Model).execute(() => new Model());

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

	inject.for(Model).execute(() => new Model()).singleton();

	const m = inject(Model);

	m.test(); // ?
	m.test(); // ?
	m.test(); // ?

	const m2 = inject(Model);
	m2.test(); //?
	expect(m2.test()).toBe(4);

});