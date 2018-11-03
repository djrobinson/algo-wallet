require('babel-polyfill');
require('es6-promise').polyfill();
require('isomorphic-fetch');
const events = require('events');
const emitter = new events.EventEmitter;

class ExchangeEmitter {


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
  createRestConfigs(markets, exchanges) {
     const x = {
      bittrex: new ccxt.bittrex ({
        'apiKey': process.env.BITTREX_API_KEY,
        'secret': process.env.BITTREX_SECRET,
        'verbose': false, // set to true to see more debugging output
        'timeout': 60000,
        'enableRateLimit': true, // add this
      }),
      poloniex: new ccxt.poloniex ({
        'apiKey': process.env.POLONIEX_API_KEY,
        'secret': process.env.POLONIEX_SECRET,
        'verbose': false, // set to true to see more debugging output
        'timeout': 60000,
        'enableRateLimit': true, // add this
      })
    }
  }
}

module.exports = { ExchangeEmitter, emitter };
