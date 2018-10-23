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
    this.marketMap = {
      7  : 'BTC_BCN',
      14 : 'BTC_BTS',
      15 : 'BTC_BURST',
      20 : 'BTC_CLAM',
      25 : 'BTC_DGB',
      27 : 'BTC_DOGE',
      24 : 'BTC_DASH',
      38 : 'BTC_GAME',
      43 : 'BTC_HUC',
      50 : 'BTC_LTC',
      51 : 'BTC_MAID',
      58 : 'BTC_OMNI',
      61 : 'BTC_NAV',
      64 : 'BTC_NMC',
      69 : 'BTC_NXT',
      75 : 'BTC_PPC',
      89 : 'BTC_STR',
      92 : 'BTC_SYS',
      97 : 'BTC_VIA',
      100: 'BTC_VTC',
      108: 'BTC_XCP',
      114: 'BTC_XMR',
      116: 'BTC_XPM',
      117: 'BTC_XRP',
      112: 'BTC_XEM',
      148: 'BTC_ETH',
      150: 'BTC_SC',
      155: 'BTC_FCT',
      162: 'BTC_DCR',
      163: 'BTC_LSK',
      167: 'BTC_LBC',
      168: 'BTC_STEEM',
      170: 'BTC_SBD',
      171: 'BTC_ETC',
      174: 'BTC_REP',
      177: 'BTC_ARDR',
      178: 'BTC_ZEC',
      182: 'BTC_STRAT',
      184: 'BTC_PASC',
      185: 'BTC_GNT',
      189: 'BTC_BCH',
      192: 'BTC_ZRX',
      194: 'BTC_CVC',
      196: 'BTC_OMG',
      198: 'BTC_GAS',
      200: 'BTC_STORJ',
      201: 'BTC_EOS',
      204: 'BTC_SNT',
      207: 'BTC_KNC',
      210: 'BTC_BAT',
      213: 'BTC_LOOM',
      221: 'BTC_QTUM',
      232: 'BTC_BNT',
      229: 'BTC_MANA',
      166: 'ETH_LSK',
      169: 'ETH_STEEM',
      172: 'ETH_ETC',
      176: 'ETH_REP',
      179: 'ETH_ZEC',
      186: 'ETH_GNT',
      190: 'ETH_BCH',
      193: 'ETH_ZRX',
      195: 'ETH_CVC',
      197: 'ETH_OMG',
      199: 'ETH_GAS',
      202: 'ETH_EOS',
      205: 'ETH_SNT',
      208: 'ETH_KNC',
      211: 'ETH_BAT',
      214: 'ETH_LOOM',
      222: 'ETH_QTUM',
      233: 'ETH_BNT',
      230: 'ETH_MANA'
    }
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
        this.parseResponse(msg.data, market);
      }
    }

    this.socket.onclose = () => {
      console.log("Poloniex Websocket connection closed");
    };
  }

  parseOrderDelta(data, market) {
    const orderTypeLookup = {
      0: 'SELL',
      1: 'BUY'
    }
    if (data[0] === 'n') {
      const delta = {
        id: data[2],
        type: 'OPEN',
        exchange: this.exchangeName,
        market: market,
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
          exchange: this.exchangeName,
          market: market
        }
        this.emitOrderDelta(delta)
      }
      console.log("Unhandled POLO order event: ", data)
    }
  }

  parseResponse(marketDelta, market) {
    const data = JSON.parse(marketDelta)
    console.log("What is polo data: ", data)
    if (data && data[0] === 1000) {
      if (data[2].length) {
        data[2].forEach(d => this.parseOrderDelta(d, market))
      }

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
      const mkt = this.marketMap[data[0]]
      data[2].forEach(delta => {
        if (delta[0] === 'o') {
          if (delta[1]) {
            // 1 for Bid
            let bidChange = {
              type: 'BID_UPDATE',
              market: mkt,
              rateString: this.exchangeName + mkt + delta[2],
              rate: parseFloat(delta[2]),
              amount: parseFloat(delta[3])
            }
            this.emitOrderBook(bidChange);
          } else {
            // 0 for ask
            let askChange = {
              type: 'ASK_UPDATE',
              market: mkt,
              rateString: this.exchangeName + mkt + delta[2],
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