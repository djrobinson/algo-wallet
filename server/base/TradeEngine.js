"use strict"

const Bittrex = require('../integrations/Bittrex')
const Poloniex = require('../integrations/Poloniex')
const { emitter } = require('./Exchange')
const OrderUpdate = require('../db/models/orderUpdate.model');
const ccxt = require ('ccxt')
const log = require ('ololog').configure ({ locate: false })

let masterBook = {}

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

// TODO: WILL EVENTUALLY BE INPUTS
let runType = 'NONE'
let intervalSize = 20000
let newIntervalFlags = {}
let desiredDepth = {
  ETH: 30,
  BTC: 5
}

let currentBalances = {}
let pendingOrders = {}
let pendingCancels = []
let openOrders = {}
let iterator = 0
let marketInfo = {}
let pairCount = {
  ETH: 0,
  BTC: 0
}

const maxOrderDepth = 50

let bittrex

const start = async (markets, exchanges, tradeEngineCallback, orderActionCallback) => {
  exchanges.forEach(exch => {
    getBalances(exch)
    openOrders[exch] = []
  })

  const bittrexArray = await x['bittrex'].fetchMarkets()
  const poloArray = await x['poloniex'].fetchMarkets()

  const marketArray = bittrexArray.concat(poloArray)
  marketInfo = marketArray.reduce((acc, market) => {
    acc[market.id] = market
    return acc
  }, {})
  log.bright.blue(marketInfo)

  bittrex = new Bittrex()
  bittrex.initOrderDelta()
  setTimeout(() => { bittrex.initOrderBook(markets[0]) }, 3000)

  const poloniex = new Poloniex()
  poloniex.initOrderDelta()

  markets.forEach((market, i) => {
    const base = market.slice(0, 3)
    pairCount[base]++
    setTimeout(() => {
      poloniex.initOrderBook(market)
    },3000 * (i + 1))
  })

  setTimeout(() => {
    markets.forEach((market, i) => {
      if (i) {
        newIntervalFlags[market] = false
        bittrex.initOrderBook(market)
      }

    })
  }, 6000)

  if (runType === 'ON_INTERVAL') {
    setInterval(() => {
      markets.forEach(market => {
        newIntervalFlags[market] = true
      })
    }, intervalSize)
  }

  emitter.on('ORDER_BOOK_INIT', initializeOrderBooks)
  emitter.on('MARKET_UPDATE', updatePriceAndRunStrategy)

  const onOrderDelta = event => {
    handleOrderDelta(event)
    orderActionCallback(event)
  }
  emitter.on('ORDER_DELTA', onOrderDelta)

  const boundCb = tradeEngineCallback.bind(this)
  setInterval(() => {
    markets.forEach(market => {
      boundCb({
        market,
        ...masterBook[market]
      })
    })
  }, 1000)
}

const stop = () => {
  if (bittrex) {
    bittrex.stopOrderBook()
  }
}

const calculateAmount = (exchange, base, alt, side, rate) => {
  if (side === 'buy') {
    const fee = currentBalances[exchange][base].free * .0025
    const altAmount = (currentBalances[exchange][base].free - fee) / rate / pairCount[base]
    const minimum = marketInfo[base + '-' + alt].limits.amount.min
    if (minimum < altAmount) {
      return altAmount
    }
    return null
  }
  if (side === 'sell') {
    const fee = currentBalances[exchange][alt].free * .0025
    const baseAmount = (currentBalances[exchange][alt].free - fee)
    const minimum = marketInfo[base + '-' + alt].limits.amount.min
    if (minimum < baseAmount) {
      return baseAmount
    }
    return null
  }
}

const orderWorkflow = async (exchange, pair, side, rate) => {
  const base = pair.slice(0, pair.indexOf('-'))
  const alt = pair.slice(pair.length - pair.indexOf('-'), pair.length)
  const amount = calculateAmount(exchange, base, alt, side, rate)
  if (amount) {
    if (openOrders[exchange].length) {
      console.log("We've got an update!!")
      // Clone and erase openOrders
      // THIS SHOULDN'T BE ALL ORDERS
      const orders = openOrders[exchange].slice(0)
      for (const order of orders) {
        const cancelResponse = await cancelOrder(order)
        log.bright.red( "Cancel results: ", cancelResponse )
      }
    }
    const asset = side === 'buy' ? base : alt
    if (!pendingOrders[asset]) {
      pendingOrders[asset] = true
      let orderResults
      try {
        orderResults = await createOrder(exchange, alt + '/' + base, 'limit', side, amount, rate)
      } catch (e) {
        log.bright.red("Error while creating order ", e)
        orderResults = e
      } finally {
        pendingOrders[asset] = false
        return orderResults
      }

    } else {
      return 'Order pending'
    }
  } else {
    return 'Insufficient funds'
  }
}

const runStrategy = async (event) => {
  console.log("Running strategy", event)
  const pair = event.market
  const side = 'sell'
  const exchange = event.exchange
  if (masterBook[pair].summary.bidDesiredDepth) {
    console.log("Executing buy")
    const buyRate = masterBook[pair].summary.bidDesiredDepth
    const buyResult = await orderWorkflow(exchange, pair, 'buy', buyRate)
    log.bright.green( "Buy order result: ", buyResult, event.exchange )
  }
  if (masterBook[pair].summary.askDesiredDepth) {
    console.log("Executing sell")
    const sellRate = masterBook[pair].summary.askDesiredDepth
    const sellResult = await orderWorkflow(exchange, pair, 'sell', sellRate)
    log.bright.red( "Sell order result: ", sellResult, event.exchange )
  }
  iterator++
}

const getBalances = async (exchange) => {
  try {
      // fetch account balance from the exchange, save to global variable
      currentBalances[exchange] = await x[exchange].fetchBalance()
      log.bright.yellow(currentBalances[exchange].free)
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

const createOrder = async (exchange, symbol, orderType, side, amount, price) => {
  try {
    log.bright.yellow("Order: ", symbol, side, price, amount)
    const response = await x[exchange].createOrder (symbol, orderType, side, amount, price)
    log.bright.magenta ('Create Order Succeeded: ', exchange, symbol, side, amount)
    return response
  } catch (e) {
    log.bright.magenta (symbol, side, x[exchange].iso8601 (Date.now ()), e.constructor.name, e.message)
    log.bright.magenta ('Failed')
  }
}

const cancelOrder = async (order) => {
  const exchange = order.exchange
  const id = order.id
  if (pendingCancels.indexOf(id) === -1) {
    console.log("What is ID for cancel ", id)
    pendingCancels.push(id)
    try {
      const response = await x[exchange].cancelOrder(id)
      log.bright.magenta (response)
      if (response) {
        const cancelIndex = pendingCancels.indexOf(id)
        pendingCancels.splice(cancelIndex, 1)
      }

    } catch (e) {
      log.bright.magenta ('Cancel Failed', e, order)
    }
  } else {
    console.log("Dupe cancel prevented")
  }
}

const handleOrderDelta = (delta) => {
  if (delta.type === 'OPEN') {
    openOrders[delta.exchange].push(delta)
  }
  if (delta.type === 'CANCEL') {
    console.log("We're on the handle order cancellation: ", delta)
    openOrders[delta.exchange] = openOrders[delta.exchange].filter(o => (o.id !== delta.id))
  }
}

// Stealing from exchang agg
const initializeOrderBooks = (event) => {
  console.log("Initting order books: ", event.exchange, event.market)
  const market = event.market
  let newBook = {}
  if (masterBook[market] && masterBook[market].bids) {
    const allBids = {...event.bids, ...masterBook[market].bids};
    const allBidRates = Object.keys(allBids);
    const sortedBids = allBidRates.sort((a, b) => {
      return allBids[b].rate - allBids[a].rate;
    });
    if (!masterBook[market].summary) {
      newBook.summary = {}
    } else {
      newBook.summary = masterBook[market].summary
    }
    newBook.summary.highestBid = allBids[sortedBids[0]].rate;
    const bidBook = {};
    sortedBids.forEach(bid => {
      bidBook[bid] = allBids[bid];
    })
    newBook.bids = bidBook;
  } else {
    newBook.summary = {}
    newBook.summary.highestBid = event.bids[Object.keys(event.bids)[0]].rate;
    newBook.bids = event.bids;
  };

  if (masterBook[market] && masterBook[market].asks) {
    const allAsks = {...event.asks, ...masterBook[market].asks};
    const allAskRates = Object.keys(allAsks);
    const sortedAsks = allAskRates.sort((a, b) => {
      return allAsks[a].rate - allAsks[b].rate;
    });
    if (!masterBook[market].summary) {
      newBook.summary = {}
    } else {
      newBook.summary = masterBook[market].summary
    }
    newBook.summary.lowestAsk = allAsks[sortedAsks[0]].rate;
    const askBook = {};
    sortedAsks.forEach(ask => {
      askBook[ask] = allAsks[ask];
    })
    newBook.asks = askBook;
  } else {
    newBook.summary = {}
    newBook.summary.lowestAsk = event.asks[Object.keys(event.asks)[0]].rate
    newBook.asks = event.asks;
  };
  masterBook[market] = newBook
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
      if (runType === 'ON_INTERVAL' && newIntervalFlags[market]) {
        console.log("New interval!!")
        recalculate = true
        newIntervalFlags[market] = false
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
    return [newBook, book]
  } else if (book[identifier]) {
    let order = {
      exchange: exchange,
      rate: rate,
      market: market,
      amount: amount
    }
    newBook[identifier] = order
    return [newBook, book]
  } else if (parseFloat(amount) > 0) {
    let order = {
      exchange: exchange,
      rate: rate,
      market: market,
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
    newBook = sortedNewBook
  }
  let sumAccumulator = 0

  Object.keys(newBook).forEach(o => {
     sumAccumulator = sumAccumulator + newBook[o].amount
     newBook[o].sum = sumAccumulator
  })
  return [newBook, book]
}

const checkPriceAndVolume = (type, market, newBook, oldBook) => {
  // Return orderBook summary here. Will be saved periodically
  // Will also be analyzed based on run strategy settings (potentially everyupdate)
  const newKeys = Object.keys(newBook)
  const oldKeys = Object.keys(oldBook)
  const base = market.slice(0,3)

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
    const { volumeAt50Orders, desiredDepthRate, maxAmount } = tallyVolumeStats(newBook, newKeys, desiredDepth[base])
    summary.bidVolumeAt50Orders = volumeAt50Orders
    summary.bidDesiredDepth = desiredDepthRate
    summary.largestBid = maxAmount
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
    const { volumeAt50Orders, desiredDepthRate, maxAmount } = tallyVolumeStats(newBook, newKeys, desiredDepth[base])
    summary.lowestAsk = newAsk
    summary.askVolumeAt50Orders = volumeAt50Orders
    summary.askDesiredDepth = desiredDepthRate
    summary.largestAsk = maxAmount
  }
  const newSummary = {
    ...oldSummary,
    ...summary
  }
  return newSummary
}

const tallyVolumeStats = (book, newKeys, desiredDepth) => {
  let volumeCounter = 0
  let maxAmount = 0
  let foundOrder = false
  let desiredDepthRate
  newKeys.forEach((order, i) => {
    if (volumeCounter > desiredDepth && !foundOrder) {
      desiredDepthRate = book[order].rate
      foundOrder = true
      volumeCounter += (book[order].amount * book[order].rate)
    } else if (i < 50) {
      volumeCounter += (book[order].amount * book[order].rate)
    }
    if ( book[order].amount > maxAmount ) {
      maxAmount = book[order].amount
    }
  })
  return {
    volumeAt50Orders: volumeCounter,
    desiredDepthRate,
    maxAmount
  }
}

module.exports = {start, stop}