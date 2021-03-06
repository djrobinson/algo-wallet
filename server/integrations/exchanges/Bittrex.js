const signalR = require ('signalr-client');
const ccxt = require ('ccxt')
const jsonic = require('jsonic');
const zlib = require('zlib');
const { ExchangeEmitter } = require('../ExchangeEmitter');
const CryptoJS = require('crypto-js');


class Bittrex extends ExchangeEmitter {
  constructor() {
    super('bittrex')
    this.client = {}
    this.restExchange = new ccxt.bittrex ({
        'apiKey': process.env.BITTREX_API_KEY,
        'secret': process.env.BITTREX_SECRET,
        'verbose': false, // set to true to see more debugging output
        'timeout': 60000,
        'enableRateLimit': true, // add this
    })
    this.marketsUrl = 'https://bittrex.com/api/v1.1/public/getmarkets';
  }

  async getMarket() {
    try {
      const markets = await this.get(this.marketsUrl);
      const parsedMarkets = this.parseMarkets(markets.result);
      return Promise.resolve(parsedMarkets);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  parseMarkets(raw) {
    return raw.map((mkt) => {
      return {
        market: mkt.MarketName,
        logo: mkt.LogoUrl
      }
    })
  }

  stopOrderBook() {
    if (this.client) {
      console.log("Stopping bittrex ws");
      this.client.end();
    }
  }

  initExchange() {

    const orderClient = new signalR.client (
      'wss://beta.bittrex.com/signalr',
      ['c2']
    );
    const boundSignature = this.createSignature.bind(this);
    const self = this;
    const boundEmitExchangeReady = this.emitExchangeReady.bind(this)
    const exchangeName = this.exchangeName
    orderClient.serviceHandlers.connected = (connection) => {
      console.log ('connected');
      boundEmitExchangeReady(exchangeName)

      const apiKey = process.env.BITTREX_API_KEY
      orderClient.call ('c2', 'GetAuthContext', apiKey).done ((err, challenge) => {
        if (err) { console.log("GetAuthContext error: ", err); }
        if (challenge) {
          const apiSecret = process.env.BITTREX_SECRET
          console.log ('Challenge: ' + challenge);
          const signature = boundSignature(apiSecret, challenge)
          console.log("What is signature", signature)
          orderClient.call ('c2', 'Authenticate', apiKey, signature).done (function (err, result) {
            if (err) { console.log("Error during Authenticate: ", err); }
            if (result) {
              console.log ('Worked?', result);
            }
          });
        }
      });
    }
    this.client = orderClient

    orderClient.serviceHandlers.connectFailed = (err) => {
      console.log("Bittrex Connect Failed", err);
    }

    orderClient.serviceHandlers.onerror = (err) => {
      console.log("Bittrex WS Error", err);
      this.emitOrderBook({
        type: 'WS_ERROR',
        exchange: 'bittrex'
      });
    }

    orderClient.serviceHandlers.onclose = () => {
      console.log("Bittrex Websocket close");
    }
    const boundParser = this.parseMarketDelta.bind(this);
    const boundInitExchangeDelta = this.initExchangeDelta.bind(this);
    const boundParseOrderDelta = this.parseOrderDelta.bind(this);

    orderClient.serviceHandlers.messageReceived = function (message) {
      let data = jsonic (message.utf8Data);
      let json;
      if (data.hasOwnProperty ('R')) {
        let b64 = data.R;

        let raw = new Buffer.from(b64.toString(), 'base64');
        zlib.inflateRaw (raw, (err, inflated) => {
          if (! err) {
            let json = JSON.parse (inflated.toString ('utf8'));
            boundParser('ORDER_BOOK_INIT', json, json.M)
            // Start only after order book inits
            boundInitExchangeDelta(json.M);
          }
        });
      }
      if (data.hasOwnProperty('M') && data['M'][0] && data['M'][0].hasOwnProperty('A')) {
        let b64 = data.M[0].A[0];

        let raw = new Buffer.from(b64, 'base64');
        zlib.inflateRaw (raw, (err, inflated) => {
          if (! err) {
            let json = JSON.parse (inflated.toString ('utf8'));
            if (json.hasOwnProperty('M')) {

              boundParser('MARKET_DELTA', json, json.M)
            }
            if (json.hasOwnProperty('o')) {
              boundParseOrderDelta(json, json.M)
            }
          }
        });
      }
    }

  }

  createSignature(apiSecret, challenge) {
    const encodedSecret = new Buffer(apiSecret, "ascii")
    const encodedChallenge = new Buffer(challenge, "ascii")
    console.log("Encoded secret: ", encodedSecret)
    const sigBuffer = CryptoJS.HmacSHA512(challenge, apiSecret)
    const signature = sigBuffer.toString().replace('-', '')
    return signature
  }

  initOrderBook(market) {

    console.log("Bittrex init order book", market);

    const self = this;


    console.log ('connected');
    self.client.call('c2', 'QueryExchangeState', market).done((err, result) => {
        if (err) { console.log(err) }

        if (result === true) {
          console.log ('Subscribed to ' + market)
        }
    });

  }

  initExchangeDelta(market) {
    this.client.call ('c2', 'SubscribeToExchangeDeltas', market).done ((err, result) => {
      if (err) { return console.log (err); }
      if (result === true) {
        console.log ('Subscribed to ' + market);
      }
    });
  }

  parseOrderDelta(orderDelta, market) {
    console.log("Parsing order delta!!!")
    if (orderDelta.hasOwnProperty('o')) {
      const typeMap = [
        'OPEN',
        'PARTIAL',
        'FILL',
        'CANCEL'
      ]
      const delta = {
        id: orderDelta.o.OU,
        type: typeMap[parseInt(orderDelta.TY)],
        exchange: this.exchangeName,
        market: orderDelta.o.E,
        orderType: orderDelta.o.OT,
        amount: orderDelta.o.Q,
        rate: orderDelta.o.X
      }
      this.emitOrderDelta(delta)
    }
  }

  parseMarketDelta(type, marketDelta, market) {
    if (type === 'ORDER_BOOK_INIT' && marketDelta['Z'] && marketDelta['S']) {
      const sortedBids = marketDelta['Z'].sort((a, b) => {
        return b.R - a.R;
      }).slice(0, this.orderBookDepth);
      const sortedAsks = marketDelta['S'].sort((a, b) => {
        return a.R - b.R;
      }).slice(0, this.orderBookDepth);
      const bids = sortedBids.reduce((aggregator, bid) => {
          let order = {
            exchange: this.exchangeName,
            market: market,
            rate: bid.R,
            amount: parseFloat(bid.Q)
          };
          const bidstr = bid.R.toString()
          aggregator[this.exchangeName + market + bidstr.replace('.', '-')] = order;
          return aggregator;
      }, {})
      const asks = sortedAsks.reduce((aggregator, ask) => {
          let order = {
            exchange: this.exchangeName,
            market: market,
            rate: ask.R,
            amount: parseFloat(ask.Q)
          };
          const askstr = ask.R.toString()
          aggregator[this.exchangeName + market + askstr.replace('.', '-')] = order;
          return aggregator;
      }, {})
      let initOrderBook = {
        type,
        market: market,
        exchange: this.exchangeName,
        bids: bids,
        asks: asks
      }
      console.log("About to init order book: ", market)
      this.emitOrderBook(initOrderBook);
    }
    if (type === 'MARKET_DELTA' && marketDelta['Z'] && marketDelta['S']) {
      marketDelta['Z'].forEach((change) => {
        const rs = change.R.toString().replace('.', '-')
        let marketDelta = {
          type: 'BID_UPDATE',
          market: market,
          rateString: this.exchangeName + market + rs,
          rate: change.R,
          amount: parseFloat(change.Q)
        }
        this.emitOrderBook(marketDelta);
      });
      marketDelta['S'].forEach((change) => {
        const rs = change.R.toString().replace('.', '-')
        let marketDelta = {
          type: 'ASK_UPDATE',
          market: market,
          rateString: this.exchangeName + market + rs,
          rate: change.R,
          amount: parseFloat(change.Q)
        }
        this.emitOrderBook(marketDelta);
      });

    }
  }
}

module.exports = Bittrex;