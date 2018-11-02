require('babel-polyfill');
require('es6-promise').polyfill();
require('isomorphic-fetch');
const events = require('events');
const emitter = new events.EventEmitter;

class ExchangeEmitter {

  exchangeName = ''
  orderBookDepth = 50

  constructor(exchangeName) {
    this.exchangeName = exchangeName
  }

  emitExchangeReady(exch) {
    emitter.emit('EXCHANGE_READY', exch)
  }

  emitOrderBook(order) {
      order['exchange'] = this.exchangeName
      if (order.type === 'ORDER_BOOK_INIT') {
        emitter.emit(order.type, order)
      } else if (order.type === 'WS_ERROR') {
        console.log("Websocket error in emit order book")
        emitter.emit(order.type, order)
      } else {
        emitter.emit('MARKET_UPDATE', order)
      }
  }

  emitOrderDelta(orderDelta) {
    emitter.emit('ORDER_DELTA', orderDelta)
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

module.exports = { ExchangeEmitter, emitter };
