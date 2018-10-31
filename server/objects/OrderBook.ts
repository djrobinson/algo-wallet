const uuidv1 = require('uuid/v1')

/*
- Represents the OrderBook model that will be periodically saved
- Need to determine if this will be combined or not
*/
class OrderBook {
  id:string
  constructor() {
    this.id = uuidv1()
  }

  initializeOrderBooks = (event) => {
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

  maintainOrderBook = (book, identifier, exchange, type, market, rate, amount) => {
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
}

