const uuidv1 = require('uuid/v1')

class Run {
  id:string
  constructor() {
    this.id = uuidv1()
  }
}