const ccxt = require ('ccxt')
const Moment = require('moment')
const WebSocket = require('ws')
const { ExchangeEmitter } = require('../ExchangeEmitter')
const { marketMap } = require('../lookup/poloniexLookup')
const CryptoJS = require('crypto-js')

class Poloniex extends ExchangeEmitter {
  constructor() {
    super('poloniex');
    this.marketsUrl = 'https://poloniex.com/public?command=return24hVolume';
    this.wsuri = 'wss://api2.poloniex.com:443';
    this.socket
    this.restExchange = new ccxt.poloniex ({
        'apiKey': process.env.POLONIEX_API_KEY,
        'secret': process.env.POLONIEX_SECRET,
        'verbose': false, // set to true to see more debugging output
        'timeout': 60000,
        'enableRateLimit': true, // add this
    })
    this.marketMap = marketMap
    console.log("Starting polo")
  }

  async getMarket() {
    try {
      const markets = await this.get(this.marketsUrl);
      const parsedMarkets = this.parseMarkets(markets);
      return Promise.resolve(parsedMarkets);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  parseMarkets(raw) {
    return Object.keys(raw).map(mkt => {
      return {
        market: mkt.replace('_', '-')
      };
    })
  }

  stopOrderBook() {
    if (this.socket) {
      console.log("Stopping Poloniex ws");
      this.socket.close();
    }
  }

  initExchange() {
    const socket = new WebSocket(this.wsuri);
    const boundEmitExchangeReady = this.emitExchangeReady.bind(this)
    const exchangeName = this.exchangeName
    socket.onopen = session => {
      console.log("Polo socket opened")
      boundEmitExchangeReady(exchangeName)
      const nonce = Date.now()
      const payload = "nonce=" + nonce

      let params = {
        command: 'subscribe',
        channel: '1000',
        key: process.env.POLONIEX_API_KEY,
        payload: payload,
        sign: CryptoJS.HmacSHA512(payload, process.env.POLONIEX_SECRET).toString()
      };
      socket.send(JSON.stringify(params));
      console.log("Init polo")
    }
    socket.onerror = error => {
      console.log("Poloniex WS Error!", error);
      this.emitOrderBook({
        type: 'WS_ERROR',
        exchange: 'poloniex'
      });
    }

    socket.onmessage = msg => {
      if (msg && msg.data) {
        this.parseResponse(msg.data);
      }
    }

    socket.onclose = () => {
      console.log("Poloniex Websocket connection closed");
    };
    this.socket = socket

  }


  initOrderBook(market) {
    console.log("Input into polo init: ", market)

    const poloMarket = market.replace('-', '_');
    let params = {command: 'subscribe', channel: poloMarket};
    this.socket.send(JSON.stringify(params));
  }

  parseOrderDelta(data) {
    const orderTypeLookup = {
      0: 'SELL',
      1: 'BUY'
    }
    if (data[0] === 'n') {
      const delta = {
        id: data[2],
        type: 'OPEN',
        exchange: this.exchangeName,
        market: data[1],
        orderType: orderTypeLookup[data[3]],
        amount: data[5],
        rate: data[4]
      }
      this.emitOrderDelta(delta)
    }
    if (data[0] === 'o') {
      if (!parseFloat(data[2])) {
        console.log("We're getting a cancel")
        const delta = {
          id: data[1],
          type: 'CANCEL',
          exchange: this.exchangeName
        }
        this.emitOrderDelta(delta)
      }
      console.log("Unhandled POLO order event: ", data)
    }
  }

  parseResponse(marketDelta) {
    const data = JSON.parse(marketDelta)
    if (data && data[0] === 1000) {
      if (data[2] && data[2].length) {
        data[2].forEach(d => this.parseOrderDelta(d))
      }

    } else if (data && data[2] && data[2][0] && data[2][0][1] && data[2][0][1].hasOwnProperty('orderBook')) {

      const market = this.marketMap[data[0]]
      console.log("Polo parse order book", market)
      // Initial Response:
      let initOrderBook = {
        type: 'ORDER_BOOK_INIT',
        exchange: this.exchangeName,
        market: market
      }
      const stringBids = data[2][0][1].orderBook[1];
      const bidRates = Object.keys(stringBids).slice(0, this.orderBookDepth);
      const bids = bidRates.reduce((aggregator, bid) => {
        let order = {
          exchange: this.exchangeName,
          market: market,
          rate: parseFloat(bid),
          amount: parseFloat(stringBids[bid])
        };
        aggregator[this.exchangeName + market + bid] = order;
        return aggregator;
      }, {});

      const stringAsks = data[2][0][1].orderBook[0];
      const askRates = Object.keys(stringAsks).slice(0, this.orderBookDepth);
      const asks = askRates.reduce((aggregator, ask) => {
        let order = {
          exchange: this.exchangeName,
          market: market,
          rate: parseFloat(ask),
          amount: parseFloat(stringAsks[ask])
        };
        aggregator[this.exchangeName + market + ask] = order;
        return aggregator;
      }, {});

      initOrderBook.asks = asks;
      initOrderBook.bids = bids;
      this.emitOrderBook(initOrderBook);
    } else if (data && data[2]) {
      const market = this.marketMap[data[0]]
      data[2].forEach((delta) => {
        if (delta[0] === 'o') {
          if (delta[1]) {
            // 1 for Bid
            let bidChange = {
              type: 'BID_UPDATE',
              market: market,
              rateString: this.exchangeName + market + delta[2],
              rate: parseFloat(delta[2]),
              amount: parseFloat(delta[3])
            }
            this.emitOrderBook(bidChange);
          } else {
            // 0 for ask
            let askChange = {
              type: 'ASK_UPDATE',
              market: market,
              rateString: this.exchangeName + market + delta[2],
              rate: parseFloat(delta[2]),
              amount: parseFloat(delta[3])
            }
            this.emitOrderBook(askChange);
          }
        }
      })
    }
  }
}

module.exports = Poloniex