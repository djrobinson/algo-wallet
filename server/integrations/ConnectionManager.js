const ccxt = require ('ccxt')
const fs = require('fs')
const { emitter } = require('./ExchangeEmitter')
const exchangesMap = require('../exchanges')

const Run = require('../db/models/run.model')
const OrderBookInit = require('../db/models/orderBookInit.model')
const OrderBookUpdate = require('../db/models/OrderBookUpdate.model')

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
    this.runId = run._id
    run.markets = markets
    run.exchanges = exchanges
    run.tradeCount = 0
    run.openedOrdersCount = 0
    run.alpha = 0
    run.save().then(res => {
      console.log("Run saved: ", res)
      this.runId = res.id
    }).catch(err => {
      console.log("Run error: ", err)
    })

    // emitter.on('EXCHANGE_READY', (exchange) => {
    //   console.log(exchange, " is connected")
    //   markets.forEach((market) => {
    //     this.ws[exchange].initOrderBook(market)
    //   })
    // })

    // emitter.on('ORDER_BOOK_INIT', (event) => {
    //   console.log("ORDER_BOOK_INIT ", event)
    //   const orderBookInit = OrderBookInit();
    //   orderBookInit.exchange = event.exchange
    //   orderBookInit.market = event.market
    //   orderBookInit.bids = event.bids
    //   orderBookInit.asks = event.asks
    //   orderBookInit.runId = this.runId
    //   orderBookInit.save().then((err, res) => {
    //     if (err) console.log("Error saving OrderBookInit : ", err)
    //     console.log("OrderBookInit saved: ", res)
    //   })
    // })

    // emitter.on('ORDER_BOOK_UPDATE', (event) => {
    //   console.log("ORDER_BOOK_UPDATE ", event)
    //   const orderBookUpdate = OrderBookUpdate();
    //   orderBookUpdate.type = event.type
    //   orderBookUpdate.rate = event.rate
    //   orderBookUpdate.amount = event.amount
    //   orderBookUpdate.exchange = event.exchange
    //   orderBookUpdate.rateString = event.rateString
    //   orderBookUpdate.runId = this.runId
    //   orderBookUpdate.save().then((err, res) => {
    //     if (err) console.log("Error saving OrderBookUpdate : ", err)
    //     console.log("OrderBookUpdate saved: ", res)
    //   })
    // })

    emitter.on('ORDER_DELTA', (event) => {
      console.log("ORDER_DELTA ", event)
      cbs.registerOrderActions(event)
    })
  }

  stopWebsockets() {

  }
}

module.exports = { ConnectionManager }



