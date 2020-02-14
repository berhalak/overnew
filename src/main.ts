import { virtual, Class, singleton } from ".";

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

let m = new Model();
m.save();