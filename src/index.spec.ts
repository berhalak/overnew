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