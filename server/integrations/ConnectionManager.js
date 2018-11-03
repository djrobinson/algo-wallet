const ccxt = require ('ccxt')
const { emitter } = require('./ExchangeEmitter')
const Bittrex = require('./exchanges/Bittrex')
const Poloniex = require('./exchanges/Poloniex')


class ConnectionManager {
  constructor(markets, exchanges) {

  }

  startWebsockets(markets, exchanges) {
    let ws = {}

    const bittrex = new Bittrex()
    bittrex.initExchange()

    const poloniex = new Poloniex()
    poloniex.initExchange()

    ws['bittrex'] = bittrex
    ws['poloniex'] = poloniex

    emitter.on('EXCHANGE_READY', (exchange) => {
      console.log(exchange, " is connected")
      markets.forEach((market) => {
        ws[exchange].initOrderBook(market)
      })
    })
    emitter.on('ORDER_BOOK_INIT', (event) => {
      console.log("ORDER_BOOK_INIT ", event)
    })
    emitter.on('MARKET_UPDATE', (event) => {
      console.log("MARKET_UPDATE ", event)
    })
    emitter.on('ORDER_DELTA', (event) => {
      console.log("ORDER_DELTA ", event)
    })
  }
}



