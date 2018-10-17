/*
TODO: CREATE A CLASS THAT HAS THE REST/WS COMMON FUNCTIONS, COMMON
PROPERTIES, AND OVERRIDABLE GETMETHODS FOR MARKETS & ORDERBOOK
*/

require('babel-polyfill');
require('es6-promise').polyfill();
require('isomorphic-fetch');
const events = require('events');
const emitter = new events.EventEmitter;

class Exchange {

  constructor() {
    this.orderBookDepth = 50;
  }

  emitOrderBook(order) {
      order['exchange'] = this.exchangeName;
      if (order.type === 'ORDER_BOOK_INIT') {
        emitter.emit(order.type, order);
      } else if (order.type === 'WS_ERROR') {
        emitter.emit(order.type, order);
      } else {
        emitter.emit('ORDER_UPDATE', order);
      }
  }

  get(url){
    return fetch(url)
      .then(this.handleErrors)
      .then(response => response.json())
      .catch(err => console.log(err))
  }

  handleErrors(response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }

}

module.exports = { Exchange, emitter };
