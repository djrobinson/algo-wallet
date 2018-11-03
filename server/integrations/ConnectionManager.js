const ccxt = require ('ccxt')
const { emitter } = require('../ExchangeEmitter')
const Bittrex = require('../exchanges/Bittrex')
const Poloniex = require('../exchanges/Poloniex')


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



