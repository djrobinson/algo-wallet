/*
CLASS THAT INSTANTIATES MULTIPLE EXCHANGE OBJECTS AND CALLS THEIR
APIS CONCURRENTLY TO THEN RETURN THE VALUES IN A DICTIONARY SO FE
CAN DISPLAY COMBINED EXCHANGE INFORMATION
*/
const { emitter } = require('./Exchange');
const availableExchanges = require('../exchanges');


class ExchangeAggregator {

  constructor(exchanges) {
    this.subscriptions = {};
    this.exchanges = [];
    this.highestBid;
    this.lowestAsk;
    this.currentMarket = '';
    this.interval;
    this.mergedOrderBook = {};
    if (exchanges.length) {
      exchanges.forEach(exchangeName => {
        this.exchanges.push(exchangeName);
        const instantiatedExchange = new availableExchanges[exchangeName]();
        instantiatedExchange.initOrderDelta();
        this.subscriptions[exchangeName] = instantiatedExchange;
      })
    }
    console.log("Exchange agg");
  }

  sendWebSocket(msg) {
      console.log("What is socket msg ", msg);
  }

  subscribeToOrderBooks(market, callback) {

    this.mergedOrderBook[market] = {
      bids: {},
      asks: {}
    }

    const boundCallback = callback.bind(this);
    this.exchanges.forEach(exchange => this.subscriptions[exchange].initOrderBook(market))
    emitter.on('ORDER_BOOK_INIT', (event) => { this.mergeOrderBooks(market, event, boundCallback) })
    emitter.on('MARKET_UPDATE', (event) => {
      this.updateOrderBook(event, market);
    });
    emitter.on('WS_ERROR', (event) => {
      boundCallback(JSON.stringify(event))
    })
    this.interval = setInterval(() => {
      const orderBookEvent = {
        type: 'ORDER_BOOK_INIT',
        market: market,
        highestBid: this.highestBid,
        lowestAsk: this.lowestAsk,
        orderBook: this.mergedOrderBook[market]
      }
      boundCallback(JSON.stringify(orderBookEvent));
    }, 1000)
  }

  removeAllSubscriptions() {
    this.exchanges.forEach(exchange => this.subscriptions[exchange].stopOrderBook());
  }

  mergeOrderBooks(market, event, callback) {
    if (event.market === market) {
      if (this.mergedOrderBook[market].bids) {
        const allBids = {...event.bids, ...this.mergedOrderBook[market].bids};
        const allBidRates = Object.keys(allBids);
        const sortedBids = allBidRates.sort((a, b) => {
          return allBids[b].rate - allBids[a].rate;
        });

        this.highestBid = allBids[sortedBids[0]].rate;
        const bidBook = {};
        sortedBids.forEach(bid => {
          bidBook[bid] = allBids[bid];
        })
        this.mergedOrderBook[market].bids = bidBook;
      } else {
        this.highestBid = event.bids[Object.keys(event.bids)[0]].rate;
        this.mergedOrderBook[market].bids = event.bids;
      };

      if (this.mergedOrderBook[market].asks) {
        const allAsks = {...event.asks, ...this.mergedOrderBook[market].asks};
        const allAskRates = Object.keys(allAsks);
        const sortedAsks = allAskRates.sort((a, b) => {
          return allAsks[a].rate - allAsks[b].rate;
        });
        this.lowestAsk = allAsks[sortedAsks[0]].rate;
        const askBook = {};
        sortedAsks.forEach(ask => {
          askBook[ask] = allAsks[ask];
        })
        this.mergedOrderBook[market].asks = askBook;
      } else {
        this.lowestAsk = event.asks[Object.keys(event.asks)[0]].rate
        this.mergedOrderBook[market].asks = event.asks;
      };

      const orderBookEvent = {
        type: 'ORDER_BOOK_INIT',
        exchange: event.exchange,
        market: market,
        highestBid: this.highestBid,
        lowestAsk: this.lowestAsk,
        orderBook: this.mergedOrderBook[market]
      }

      callback(JSON.stringify(orderBookEvent));
    }
  }

  updateOrderBook(event, market) {
    if (event.market === market) {
      let book = {};
      let type = '';
      if (event.type === 'BID_UPDATE') {
        type = 'bids';
        book = this.mergedOrderBook[market].bids;
      }
      if (event.type === 'ASK_UPDATE') {
        type = 'asks';
        book = this.mergedOrderBook[market].asks;
      }
      if (book) {
        if (!event.amount) {

          if (book[event.rateString]) {
            delete book[event.rateString];
          }
          this.mergedOrderBook[market][type] = book;
        } else if (book[event.rateString]) {
          let order = {
            exchange: event.exchange,
            rate: event.rate,
            amount: event.amount
          };
          book[event.rateString] = order;
          this.mergedOrderBook[market][type] = book;
        } else {
          let order = {
            exchange: event.exchange,
            rate: event.rate,
            amount: event.amount
          };
          book[event.rateString] = order;
          const sortedBook = Object.keys(book).sort((a, b) => {
            if (type === 'bids') {
              return book[b].rate - book[a].rate;
            }
            if (type === 'asks') {
              return book[a].rate - book[b].rate;
            }
          });
          if (type === 'bids') {
            this.highestBid = book[sortedBook[0]].rate;
          }
          if (type === 'asks') {
            this.lowestAsk = book[sortedBook[0]].rate;
          }
          const newBook = {};
          sortedBook.forEach(b => {
            newBook[b] = book[b];
          })
          this.mergedOrderBook[market][type] = newBook;
        }
      }
    }
  }
}

module.exports = ExchangeAggregator;
