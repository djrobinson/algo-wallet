const uuidv1 = require('uuid/v1')

class Indicator {
  id:string
  constructor() {
    this.id = uuidv1()
  }
}