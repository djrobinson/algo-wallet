const uuidv1 = require('uuid/v1')

class Order {
  id:string
  constructor() {
    this.id = uuidv1()
  }
}