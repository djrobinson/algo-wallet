"use strict"

const Bittrex = require('../integrations/Bittrex')
const ExchangeAggregator = require('./ExchangeAggregator');
const { emitter } = require('./Exchange')
const OrderUpdate = require('../db/models/orderUpdate.model');
const ccxt = require ('ccxt')
const log = require ('ololog').configure ({ locate: false })

let masterBook = {}

let exchange = new ccxt.bittrex ({
    'apiKey': process.env.BITTREX_API_KEY,
    'secret': process.env.BITTREX_SECRET,
    'verbose': false, // set to true to see more debugging output
    'timeout': 60000,
    'enableRateLimit': true, // add this
  })
let runType = 'ON_PRICE_CHANGE'
let desiredDepth = {
  ETH: 20,
  BTC: 5
}
let currentBalances = {}
let pendingOrder = false
let openOrders = []
let iterator = 0
let marketInfo = {}

const maxOrderDepth = 50
// This "main" will be replaced by an exchange agg at some point
let main

const start = async (tradeEngineCallback, markets, exchanges) => {
  getBalances()
  const marketArray = await exchange.fetchMarkets()
  marketInfo = marketArray.reduce((acc, market) => {
    acc[market.id] = market
    return acc
  }, {})
  main = new Bittrex()
  // TODO: NEED RETRY AND AWAIT MECHANISM
  main.initOrderDelta()
  setTimeout(() => main.initOrderBook('BTC-ETH'), 3000)
  setTimeout(() => {
    markets.forEach(market => {
      main.initOrderBook(market)
    })
  }, 6000)


  emitter.on('ORDER_BOOK_INIT', initialize)
  emitter.on('MARKET_UPDATE', updatePriceAndRunStrategy)
  emitter.on('ORDER_DELTA', handleOrderDelta)

  const boundCb = tradeEngineCallback.bind(this)
  setInterval(() => {
    markets.forEach(market => {
      boundCb({
        market,
        ...masterBook[market]
      })
    })
  }, 5000)
}

const stop = () => {
  if (main) {
    main.stopOrderBook()
  }
}

const registerExchange = (exchange) => {
  exchange = new ccxt[exchange] ({
    'apiKey': process.env.BITTREX_API_KEY,
    'secret': process.env.BITTREX_SECRET,
    'verbose': false, // set to true to see more debugging output
    'timeout': 60000,
    'enableRateLimit': true, // add this
  })
}

const calculateAmount = (base, alt, side, rate) => {
  if (side === 'buy') {
    const fee = currentBalances[base].free * .0025
    const altAmount = (currentBalances[base].free - fee) / rate
    const minimum = marketInfo[base + '-' + alt].limits.amount.min
    if (minimum < altAmount) {
      return altAmount
    }
    return null
  }
  if (side === 'sell') {
    const fee = currentBalances[alt].free * .0025
    const baseAmount = (currentBalances[alt].free - fee)
    console.log("What is baseAmount: ", baseAmount)
    const minimum = marketInfo[base + '-' + alt].limits.amount.min * rate
    if (minimum < baseAmount) {
      return baseAmount
    }
    return null
  }
}

const orderWorkflow = async (pair, side, rate) => {
  const base = pair.slice(0, pair.indexOf('-'))
  const alt = pair.slice(pair.length - pair.indexOf('-'), pair.length)
  const amount = calculateAmount(base, alt, side, rate)
  console.log("What is amount: ", amount)
  if (amount) {
    if (openOrders.length) {
      console.log("We've got an update!!")
      // Clone and erase openOrders
      const orders = openOrders.slice(0)
      for (const order of orders) {
        const cancelResponse = await cancelOrder(order.orderUuid)
        log.bright.red( "Cancel results: ", cancelResponse )
      }

    }
    if (!pendingOrder) {
      pendingOrder = true
      const orderResults = await createOrder(alt + '/' + base, 'limit', side, amount, rate)
      pendingOrder = false
      return orderResults
    }
  }
}


// TODO: REFORM EVENTS TO "INDICATOR_EVENT" INSTEAD OF MARKETBOOK EVENTS
const runStrategy = async (event) => {

  const askKeys = Object.keys(masterBook[event.market].asks)
  console.log("Running strategy", event.market, ' ', masterBook[event.market].asks[askKeys[4]].rate )
  const pair = event.market
  const side = 'sell'
  // Choose random bid here
  const rate = masterBook[pair].asks[askKeys[4]].rate
  const result = await orderWorkflow(pair, side, rate)
  log.bright.green( "Order result: ", result )

  iterator++
}

const getBalances = async () => {

  try {
      // fetch account balance from the exchange, save to global variable
      currentBalances = await exchange.fetchBalance()
      log.bright.lightGreen ( "Initial Balances: ", currentBalances )
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

const createOrder = async (symbol, orderType, side, amount, price) => {
  try {
    log.bright.yellow("First Order: ", symbol, side, price, amount)
    const response = await exchange.createOrder (symbol, orderType, side, amount, price)
    log.bright.magenta ('Succeeded', response)
    return response
  } catch (e) {
    log.bright.magenta (symbol, side, exchange.iso8601 (Date.now ()), e.constructor.name, e.message)
    log.bright.magenta ('Failed')
  }
}

const cancelOrder = async (id) => {
  try {
    const response = await exchange.cancelOrder(id)
    log.bright.magenta (response)
  } catch (e) {
    log.bright.magenta ('Cancel Failed')
  }
}

const handleOrderDelta = (delta) => {
  if (delta.type === 'OPEN') {
    openOrders.push(delta)
  }
  if (delta.type === 'CANCEL') {
    const asdf = openOrders.filter(o => (o.uuid !== delta.uuid))
  }
}

const initialize = (event) => {
  console.log("Initializing: ", event.market)
  masterBook[event.market] = {}
  masterBook[event.market].bids = event.bids
  masterBook[event.market].asks = event.asks
  masterBook[event.market].summary = {}
  masterBook[event.market].summary.highestBid = event.bids[Object.keys(event.bids)[0]]
  masterBook[event.market].summary.lowestAsk = event.asks[Object.keys(event.asks)[0]]
}

const updatePriceAndRunStrategy = (event) => {

  const market = event.market
  // var orderUpdateInstance = new OrderUpdate(event)

  // orderUpdateInstance.save((err) => {
  //   if (err) console.log("There was an error saving order instance")
  //   console.log("Save of order update successful")
  // })

  let book = {}
  let type = ''
  let recalculate = false
  if (masterBook.hasOwnProperty(market)) {
    const amount = event.amount
    const rate = event.rate
    const exchange = event.exchange
    const market = event.market
    const identifier = event.rateString
    if (event.type === 'BID_UPDATE') {
      type = 'bids'
      book = masterBook[market].bids
    }
    if (event.type === 'ASK_UPDATE') {
      type = 'asks'
      book = masterBook[market].asks
    }
    if (book) {
      let newBook, oldBook
      [newBook, oldBook] = maintainOrderBook(book, identifier, exchange, type, market, rate, amount)
      const newSummary = checkPriceAndVolume(type, market, newBook, oldBook)
      const isPriceChange = newSummary.isPriceChange

      if (runType === 'ON_PRICE_CHANGE' && isPriceChange) {
        console.log("PRICE CHANGE")
        recalculate = true
      }
      if (runType === 'ON_MARKET_CHANGE') {
        recalculate = true
      }
      masterBook[market].summary = newSummary
      masterBook[market][type] = newBook

      if (recalculate) {
        runStrategy(event)
      }
    }
  }
}

const maintainOrderBook = (book, identifier, exchange, type, market, rate, amount) => {
  let newBook = {}
  let bookKeys = Object.keys(book)
  bookKeys.forEach(o => {
    newBook[o] = book[o]
  })
  if (!amount && book[identifier]) {
    delete newBook[identifier]
    console.log("Remove price point")
    return [newBook, book]
  } else if (book[identifier]) {
    let order = {
      exchange: exchange,
      rate: rate,
      amount: amount
    }
    newBook[identifier] = order
    console.log("Update to amount")
    return [newBook, book]
  } else {
    let order = {
      exchange: exchange,
      rate: rate,
      amount: amount
    }
    newBook[identifier] = order
    const sortedKeys = Object.keys(newBook).sort((a, b) => {
      if (type === 'bids') {
        return newBook[b].rate - newBook[a].rate
      }
      if (type === 'asks') {
        return newBook[a].rate - newBook[b].rate
      }
    })
    let sortedNewBook = {}
    sortedKeys.forEach(o => {
      sortedNewBook[o] = newBook[o]
    })
    console.log("New price point")
    return [sortedNewBook, book]
  }
  return [newBook, book]
}

const checkPriceAndVolume = (type, market, newBook, oldBook) => {
  // Return orderBook summary here. Will be saved periodically
  // Will also be analyzed based on run strategy settings (potentially everyupdate)
  const newKeys = Object.keys(newBook)
  const oldKeys = Object.keys(oldBook)
  const base = market.slice(0,3)
  console.log("What is base: ", base)

  const oldSummary = masterBook[market].summary
  let summary = {}
  summary.isPriceChange = false

  if (type === 'bids') {
    const newBidString = newKeys[0]
    const oldBidString = oldKeys[0]
    const newBid = newBook[newBidString]
    const oldBid = oldBook[oldBidString]

    if (newBid != oldBid) {
      summary.isPriceChange = true
    }
    summary.highestBid = newBid
    const { volumeAt50Orders, desiredDepthRate } = tallyVolumeStats(newBook, newKeys, desiredDepth[base])
    summary.bidVolumeAt50Orders = volumeAt50Orders
    summary.bidDesiredDepth = desiredDepthRate
    // Check volume details
    // Determine total offer sizes at each pricepoint, cut down to maxOrderDepth if needed
    // Determine time (use Date.now() to group into minute categories)
    // Check against last summary to determine how much it has changed
    // If it is past a certain interval


  }
  if (type === 'asks') {
    const newAskString = newKeys[0]
    const oldAskString = oldKeys[0]
    const newAsk = newBook[newAskString]
    const oldAsk = oldBook[oldAskString]

    if (newAsk != oldAsk) {
      summary.isPriceChange = true
    }
    const { volumeAt50Orders, desiredDepthRate } = tallyVolumeStats(newBook, newKeys, desiredDepth[base])
    summary.lowestAsk = newAsk
    summary.askVolumeAt50Orders = volumeAt50Orders
    summary.askDesiredDepth = desiredDepthRate
  }
  const newSummary = {
    ...oldSummary,
    ...summary
  }
  return newSummary
}

const tallyVolumeStats = (book, newKeys, desiredDepth) => {
  let volumeCounter = 0
  let foundOrder = false
  let desiredDepthRate
  newKeys.forEach((order, i) => {
    if (volumeCounter > desiredDepth && !foundOrder) {
      desiredDepthRate = book[order].rate
      foundOrder = true
      volumeCounter += (book[order].amount / book[order].rate)
    } else if (i < 50) {
      volumeCounter += (book[order].amount / book[order].rate)
    }
  })
  console.log("Total volume counter: ", volumeCounter, desiredDepthRate)
  return {
    volumeAt50Orders: volumeCounter,
    desiredDepthRate
  }
}

module.exports = {start, stop}