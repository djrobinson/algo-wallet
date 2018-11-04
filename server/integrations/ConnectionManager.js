const ccxt = require ('ccxt')
const { emitter } = require('./ExchangeEmitter')
const exchangesMap = require('../exchanges')

class ConnectionManager {
  constructor() {
    this.ws = {}
  }

  startWebsockets(markets, exchanges, cbs) {

    this.ws = exchanges.reduce((acc, exch) => {
      const ws = new exchangesMap[exch]()
      ws.initExchange()
      acc[exch] = ws
      return acc
    }, {})

    emitter.on('EXCHANGE_READY', (exchange) => {
      console.log(exchange, " is connected")
      markets.forEach((market) => {
        this.ws[exchange].initOrderBook(market)
      })
    })
    emitter.on('ORDER_BOOK_INIT', (event) => {
      console.log("ORDER_BOOK_INIT ", event)
      cbs.registerOrderBookInit(event)
    })
    emitter.on('MARKET_UPDATE', (event) => {
      console.log("MARKET_UPDATE ", event)
      cbs.registerEngineEvents(event)
    })
    emitter.on('ORDER_DELTA', (event) => {
      console.log("ORDER_DELTA ", event)
      cbs.registerOrderActions(event)
    })
  }

  stopWebsockets() {

  }
}

module.exports = { ConnectionManager }



