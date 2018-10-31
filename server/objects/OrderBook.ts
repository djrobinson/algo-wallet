const uuidv1 = require('uuid/v1')

/*
- Represents the OrderBook model that will be periodically saved
- Need to determine if this will be combined or not
*/
class OrderBook {
  id:string
  masterBook:any = {}
  constructor() {
    this.id = uuidv1()
  }

  initializeOrderBooks(event:any) {
    console.log("Initting order books: ", event.exchange, event.market)
    const market = event.market
    let newBook = {}
    if (this.masterBook[market] && this.masterBook[market].bids) {
      const allBids = {...event.bids, ...this.masterBook[market].bids};
      const allBidRates = Object.keys(allBids);
      const sortedBids = allBidRates.sort((a, b) => {
        return allBids[b].rate - allBids[a].rate;
      });
      if (!this.masterBook[market].summary) {
        newBook.summary = {}
      } else {
        newBook.summary = this.masterBook[market].summary
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

    if (this.masterBook[market] && this.masterBook[market].asks) {
      const allAsks = {...event.asks, ...this.masterBook[market].asks};
      const allAskRates = Object.keys(allAsks);
      const sortedAsks = allAskRates.sort((a, b) => {
        return allAsks[a].rate - allAsks[b].rate;
      });
      if (!this.masterBook[market].summary) {
        newBook.summary = {}
      } else {
        newBook.summary = this.masterBook[market].summary
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
    this.masterBook[market] = newBook
  }

  maintainOrderBook(
                      book:any,
                      identifier:string,
                      exchange:string,
                      type:string,
                      market:string,
                      rate:number,
                      amount:number
                    ) {
    let newBook:any = {}
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

