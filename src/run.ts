import { Class, virtual, override } from ".";

Class.clear();

@virtual
class Default {
    hello() {
        return "default";
    }
}

@override(Default)
class Extern implements Default {
    hello() {
        return "extern";
    }
}

console.log(new Default().hello());