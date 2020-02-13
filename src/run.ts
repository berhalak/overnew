import { Class, virtual, override } from ".";

Class.clear();

@virtual
class Default {
    name = "Default";

    static className = "Default";

    id() {
        return this.name;
    }

    hello() {
        return "Default name is " + this.id();
    }
}

//@override(Default)
class Extern extends Default {
    surname = "Extern";

    static className = "Extern";

    hello() {
        return "Extern name is " + this.id() + " surname " + this.surname;
    }
}

const obj = new Default();

console.log(obj.name);
console.log(obj.hello());