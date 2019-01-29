const ccxt = require ('ccxt')
const fs = require('fs')
const { emitter } = require('./ExchangeEmitter')
const exchangesMap = require('../exchanges')

const Run = require('../db/models/run.model')

class ConnectionManager {
  constructor() {
    this.ws = {}
    this.runId = null
  }

  // When we start a connection do the following:
  // Insert a new run into the runs collection, return id
  // Init order books w/ that run id number, save to inits
  // Market updates should also have run id reference

  startWebsockets(markets, exchanges, cbs) {

    this.ws = exchanges.reduce((acc, exch) => {
      const ws = new exchangesMap[exch]()
      ws.initExchange()
      acc[exch] = ws
      return acc
    }, {})



    // Save run, store id on object to persist to handlers below
    const run = Run()
    run.markets = markets
    run.exchanges = exchanges
    run.tradeCount = 0
    run.openedOrdersCount = 0
    run.alpha = 0
    run.save().then((err, res) => {
      if (err) console.log("Error saving run : ", err)
      console.log("Run saved: ", res)
    })

    emitter.on('EXCHANGE_READY', (exchange) => {
      console.log(exchange, " is connected")
      markets.forEach((market) => {
        this.ws[exchange].initOrderBook(market)
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
      cbs.registerOrderActions(event)
    })
  }

  stopWebsockets() {

  }
}

module.exports = { ConnectionManager }



