import { virtual, Class } from ".";

@virtual
class Default {
    hello() {
        return "default";
    }
}

Class.for(Default).return({
    val: 5
});

const t = new Default();

console.log(t);