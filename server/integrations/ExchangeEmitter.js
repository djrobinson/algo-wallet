require('babel-polyfill');
require('es6-promise').polyfill();
require('isomorphic-fetch');
const log = require ('ololog')
const ccxt = require ('ccxt')
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
        emitter.emit('ORDER_BOOK_UPDATE', order)
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

  async fetchBalance() {
    const exch = this.restExchange
    try {
        // fetch account balance from the exchange, save to global variable
        const currentBalances = await exch.fetchBalance()
        return currentBalances
    } catch (e) {
        if (e instanceof ccxt.DDoSProtection || e.message.includes ('ECONNRESET')) {
            log.bright.yellow ('[DDoS Protection] ' + e.message)
        } else if (e instanceof ccxt.RequestTimeout) {
            log.bright.yellow ('[Request Timeout] ' + e.message)
        } else if (e instanceof ccxt.AuthenticationError) {
            log.bright.yellow ('[Authentication Error] ' + e.message)
        } else if (e instanceof ccxt.ExchangeNotAvailable) {
            log.bright.yellow ('[Exchange Not Available Error] ' + e.message)
        } else if (e instanceof ccxt.ExchangeError) {
            log.bright.yellow ('[Exchange Error] ' + e.message)
        } else if (e instanceof ccxt.NetworkError) {
            log.bright.yellow ('[Network Error] ' + e.message)
        } else {
            throw e
        }
    }
  }
}

module.exports = { ExchangeEmitter, emitter };
