const uuidv1 = require('uuid/v1')

class Balance {
  id:string
  constructor() {
    this.id = uuidv1()
  }
}