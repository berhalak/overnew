import { override, virtual, Class, singleton } from './index';
test('with decorators', () => {
	Class.reset();

	@virtual
	class BaseClass {
		hello() {
			return "base";
		}
	}

	@override(BaseClass)
	class DeriveClass implements BaseClass {
		hello() {
			return "derive";
		}
	}



	expect(new BaseClass().hello()).toBe("derive");
})

test('with explicit call', () => {

	Class.reset();

	@virtual
	class Default {
		hello() {
			return "default";
		}
	}

	class Extern implements Default {
		hello() {
			return "extern";
		}
	}

	Class.for(Default).use(Extern);

	expect(new Default().hello()).toBe("extern");
})

test('unwrapping', () => {

	Class.reset();

	@virtual
	class Default {
		hello() {
			return "default";
		}
	}

	class Extern implements Default {
		hello() {
			return "extern";
		}
	}

	Class.for(Default).use(Extern);

	expect(new Default().hello()).toBe("extern");

	const base = Class.unwrap(Default);

	expect(new base().hello()).toBe("default");
})

test('singleton', () => {

	Class.reset();

	@virtual
	class Default {
		hello() {
			return "default";
		}
	}

	let counter = 0;

	class Extern implements Default {
		constructor() {
			counter++;
		}
		hello() {
			return "extern";
		}
	}

	Class.for(Default).use(Extern).singleton();

	for (let i = 0; i < 10; i++) {
		new Default();
	}

	expect(counter).toBe(1);
})

test('singleton using decorator', () => {

	Class.reset();

	@singleton
	class Default {
		hello() {
			return "default";
		}
	}

	let counter = 0;

	@override(Default)
	class Extern implements Default {
		constructor() {
			counter++;
		}
		hello() {
			return "extern";
		}
	}


	for (let i = 0; i < 10; i++) {
		new Default();
	}

	expect(counter).toBe(1);
})

test('singleton using instance', () => {

	Class.reset();

	@virtual
	class Default {
		hello() {
			return "default";
		}
	}

	Class.for(Default).return({ hello() { return 5 } });

	const t = new Default();

	expect(t.hello()).toBe(5);
})

test('singleton without override', () => {

	Class.reset();

	let count = 0;
	@singleton
	class Default {
		constructor() {
			count++;
		}
		hello() {
			return "default";
		}
	}

	for (let i = 0; i < 10; i++) {
		new Default();
	}

	expect(count).toBe(1);

	const t = new Default();
	t.hello();
})

test('singleton as default parameter', () => {

	Class.reset();

	@singleton
	class Repo {
		list: Model[] = [];
		add(m: Model) {
			this.list.push(m);
		}
	}

	class Model {
		constructor(private db = new Repo()) {

		}

		save() {
			this.db.add(this);
		}
	}

	let m = [new Model(), new Model()];

	m.forEach(x => x.save());
	expect(new Repo().list.length).toBe(2);
})

test("Complex override", () => {
	Class.reset();

	@virtual
	class Default {
		notOverrideProp = "Default";

		static className = "Default";

		notOverrideFun() {
			return this.notOverrideProp;
		}

		override() {
			return 1;
		}

		test() {
			throw "Should be overridden";
		}

		callTest() {
			return this.test();
		}

		private baseMethod() {
			return "base";
		}

		callBase() {
			return this.baseMethod();
		}
	}

	@override(Default)
	class Extern extends Default {
		newProp = "Extern";

		static className = "Extern";

		override() {
			return 2;
		}

		test() {
			return this.newMethod();
		}

		newMethod() {
			return "new";
		}
	}

	const obj = new Default();

	expect(obj.notOverrideProp).toBe("Default");
	expect(Extern.className).toBe("Extern");
	expect(Default.className).toBe("Default");
	expect(obj.notOverrideFun()).toBe("Default");
	expect(obj.override()).toBe(2);
	expect(obj.test()).toBe("new");
	expect(obj.callTest()).toBe("new");
	expect(obj.callBase()).toBe("base");
})

test("No attributes", () => {
	Class.reset();

	class MyInterface {
		hello(): string {
			throw new Error("Not implemented")
		}
	}

	let count = 0;
	class MyPlugin extends MyInterface {
		constructor() {
			super();
			count++;
		}
		hello() { return "hi" };
	}

	Class.for(MyInterface).use(MyPlugin);

	expect(Class.resolve(MyInterface).hello()).toBe("hi");

	Class.for(MyInterface).use(MyPlugin).singleton();

	Class.resolve(MyInterface);
	Class.resolve(MyInterface);
	Class.resolve(MyInterface);
	Class.resolve(MyInterface);
	Class.resolve(MyInterface);

	expect(count).toBe(2); // as first was on the first test

	const instance = new MyPlugin();
	Class.for(MyInterface).return(instance);

	Class.resolve(MyInterface);
	Class.resolve(MyInterface);
	Class.resolve(MyInterface);
	Class.resolve(MyInterface);
	Class.resolve(MyInterface);
	expect(count).toBe(3); // as first was on the first test

	expect(Class.resolve(MyInterface)).toBe(instance);

	// test extreme
	Class.for(MyInterface).clear().return(5);
	expect(Class.resolve(MyInterface)).toBe(5);

	count = 0;
	Class.for(MyInterface).clear().return(() => ++count);


	Class.resolve(MyInterface);
	Class.resolve(MyInterface);
	Class.resolve(MyInterface);
	Class.resolve(MyInterface);
	Class.resolve(MyInterface);

	expect(Class.resolve(MyInterface)).toBe(6);


})


test("Clears singleton", () => {

	let count = 0;
	@singleton
	class Single {
		constructor() {
			count++;
		}
	}

	for (let i = 0; i < 10; i++) {
		new Single();
	}

	expect(count).toBe(1);

	Class.delete();

	for (let i = 0; i < 10; i++) {
		new Single();
	}

	expect(count).toBe(2);

});

test("Not registered resolve", () => {
	Class.reset();
	let count = 0;

	class First {
		constructor(private msg: string) {
			count++;

		}
		test() {
			return this.msg;
		}
	}
	const first = Class.resolve(First, "a");
	expect(first.test()).toBe('a');
	expect(count).toBe(1);
	Class.resolve(First, "a")
	expect(count).toBe(2);
});

test("Not registered as singleton", () => {
	Class.reset();
	let count = 0;
	@singleton
	class First {
		constructor(private msg: string) {
			count++;
		}
		test() {
			return this.msg;
		}
	}
	const first = Class.resolve(First, "a");
	expect(first.test()).toBe('a');
	expect(count).toBe(1);
	Class.resolve(First, "a")
	expect(count).toBe(1);
});