const uuidv1 = require('uuid/v1')

class Indicator {
  id
  constructor() {
    this.id = uuidv1()
  }
}