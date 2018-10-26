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
      if (runType === 'ON_INTERVAL' && newIntervalFlags[exchange][market]) {
        console.log("New interval!!")
        recalculate = true
        newIntervalFlags[exchange][market] = false
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