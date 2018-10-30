const uuidv1 = require('uuid/v1')

class OrderBook {
  id:string
  constructor() {
    this.id = uuidv1()
  }
}