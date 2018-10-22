/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/
const Moment = require('moment');
const WebSocket = require('ws');
const { Exchange } = require('../base/Exchange');
const CryptoJS = require('crypto-js');

class Poloniex extends Exchange {

  constructor() {
    super();
    this.exchangeName = 'poloniex';
    this.marketsUrl = 'https://poloniex.com/public?command=return24hVolume';
    this.wsuri = 'wss://api2.poloniex.com:443';
    this.socket
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

  initOrderDelta() {
    const socket = new WebSocket(this.wsuri);
    socket.onopen = session => {
      console.log("Polo socket opened")
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
    this.socket = socket

  }


  initOrderBook(market) {

    const poloMarket = market.replace('-', '_');

    console.log("Polo socket opened")
    let params = {command: 'subscribe', channel: poloMarket};
    this.socket.send(JSON.stringify(params));
    console.log("Init polo")

    this.socket.onerror = error => {
      console.log("Poloniex WS Error!", error);
      this.emitOrderBook({
        type: 'WS_ERROR',
        exchange: 'poloniex'
      });
    }

    this.socket.onmessage = msg => {
      if (msg && msg.data) {
        this.parseMarketDelta(msg.data, market);
      }
    }

    this.socket.onclose = () => {
      console.log("Poloniex Websocket connection closed");
    };
  }

  parseMarketDelta(marketDelta, market) {
    const data = JSON.parse(marketDelta)
    if (data && data[0] == 1000) {
      console.log("POLONIEX EXCHANGE UPDATE: ", data[2])
    } else if (data && data[2] && data[2][0] && data[2][0][1] && data[2][0][1].hasOwnProperty('orderBook')) {
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
      data[2].forEach(delta => {
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