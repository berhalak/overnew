[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/berhalak/overnew) 

# overnew

npm install overnew

Simple dependency injection library

Sample:

``` ts

class Service {

}

class ConcreteService {

}

inject.for(Service).create(ConcreteService);

assert(inject(Service) instanceof ConcreteService);

```

