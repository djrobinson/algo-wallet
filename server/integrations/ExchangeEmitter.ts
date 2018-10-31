require('babel-polyfill');
require('es6-promise').polyfill();
require('isomorphic-fetch');
const events = require('events');
const emitter = new events.EventEmitter;

class ExchangeEmitter {

  exchangeName:string = ''
  orderBookDepth:number = 50

  constructor(exchangeName:string) {
    this.exchangeName = exchangeName
  }

  emitExchangeReady(exch:string) {
    emitter.emit('EXCHANGE_READY', exch)
  }

  emitOrderBook(order:any) {
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

  emitOrderDelta(orderDelta:any) {
    emitter.emit('ORDER_DELTA', orderDelta)
  }

  get(url:string){
    return fetch(url)
      .then(this.handleErrors)
      .then(response => response.json())
      .catch(err => console.log(err))
  }

  handleErrors(response:any) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }
}

module.exports = { ExchangeEmitter, emitter };
