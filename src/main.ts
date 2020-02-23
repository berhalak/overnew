import { virtual, Class, singleton } from ".";
import { override } from './index';

Class.reset();

@virtual
class Default {


	test() {
		return "failed"
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
		return "works";
	}
}


