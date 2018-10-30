const uuidv1 = require('uuid/v1')

class Trade {
  id:string
  constructor() {
    this.id = uuidv1()
  }
}