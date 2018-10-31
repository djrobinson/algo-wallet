const ccxt = require ('ccxt')
const { emitter } = require('../ExchangeEmitter')
import Bittrex = require('../exchanges/Bittrex')
import Poloniex = require('../exchanges/Poloniex')


class ConnectionManager {
  constructor(markets:Array<any>, exchanges:Array<any>) {

  }

  startWebsockets(markets:Array<any>, exchanges:Array<any>) {
    let ws:any = {}

    const bittrex = new Bittrex()
    bittrex.initExchange()

    const poloniex = new Poloniex()
    poloniex.initExchange()

    ws['bittrex'] = bittrex
    ws['poloniex'] = poloniex

    emitter.on('EXCHANGE_READY', (exchange:String) => {
      console.log(exchange, " is connected")
      markets.forEach((market) => {
        ws[exchange].initOrderBook(market)
      })
    })
    emitter.on('ORDER_BOOK_INIT', (event:any) => {
      console.log("ORDER_BOOK_INIT ", event)
    })
    emitter.on('MARKET_UPDATE', (event:any) => {
      console.log("MARKET_UPDATE ", event)
    })
    emitter.on('ORDER_DELTA', (event:any) => {
      console.log("ORDER_DELTA ", event)
    })
  }

  createRestConfigs(markets:Array<any>, exchanges:Array<any>) {
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



