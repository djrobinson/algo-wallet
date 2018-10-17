/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/
const signalR = require ('signalr-client');
const jsonic = require('jsonic');
const zlib = require('zlib');
const { Exchange } = require('../base/Exchange');
const CryptoJS = require('crypto-js');

class Bittrex extends Exchange {
  constructor() {
    super();
    this.exchangeName = 'bittrex';
    this.marketsUrl = 'https://bittrex.com/api/v1.1/public/getmarkets';
    this.client;
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
    return raw.map(mkt => {
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

  createSignature(apiSecret, challenge) {
    const encodedSecret = new Buffer(apiSecret, "ascii")
    const encodedChallenge = new Buffer(challenge, "ascii")
    const hashedSecret = CryptoJS.HmacSHA512(encodedSecret)
    const hashedChallenge = CryptoJS.HmacSHA512(encodedChallenge)
    // var hash = hmacSha512.ComputeHash(Encoding.ASCII.GetBytes(challenge));
    // return BitConverter.ToString(hash).Replace("-", string.Empty);
  }

  initOrderBook(market) {
    console.log("Bittrex init order book");
    this.client = new signalR.client (
      'wss://beta.bittrex.com/signalr',
      ['c2']
    );

    const self = this;
    const boundParser = this.parseOrderDelta.bind(this);
    const boundInitExchangeDelta = this.initExchangeDelta.bind(this);

    self.client.serviceHandlers.connected = function (connection) {
      console.log ('connected');

      self.client.call ('c2', 'GetAuthContext', apiKey).done (function (err, challenge) {
        if (err) { return console.log(err); }
        if (challenge === true) {
          console.log ('Challenge: ' + challenge);
          const signature = this.createSignature(apiSecret, challenge)
          self.client.call ('c2', 'Authenticate', apiSecret, ).done (function (err, result) {
            if (err) { return console.log(err); }
            if (result === true) {
              console.log ('Worked?');
            }
          });
        }
      });
      self.client.call ('c2', 'QueryExchangeState', market).done (function (err, result) {
        if (err) { return console.log(err); }
        if (result === true) {
          console.log ('Subscribed to ' + market);
        }
      });
    }

    self.client.serviceHandlers.connectFailed = (err) => {
      console.log("Bittrex Connect Failed", err);
    }

    self.client.serviceHandlers.onerror = (err) => {
      console.log("Bittrex WS Error", err);
      this.emitOrderBook({
        type: 'WS_ERROR',
        exchange: 'bittrex'
      });
    }

    self.client.serviceHandlers.onclose = () => {
      console.log("Bittrex Websocket close");
    }

    self.client.serviceHandlers.messageReceived = function (message) {

      let data = jsonic (message.utf8Data);
      let json;

      if (data.hasOwnProperty ('R')) {
        let b64 = data.R;

        let raw = new Buffer.from(b64, 'base64');
        zlib.inflateRaw (raw, function (err, inflated) {
          if (! err) {
            let json = JSON.parse (inflated.toString ('utf8'));
            boundParser('ORDER_BOOK_INIT', json, market);
            // Start only after order book inits
            boundInitExchangeDelta(market);
          }
        });
      }
    }
  }

  initExchangeDelta(market) {

    const self = this;
    const boundParser = this.parseOrderDelta.bind(this);


    self.client.call ('c2', 'SubscribeToExchangeDeltas', market).done (function (err, result) {
      if (err) { return console.log (err); }
      if (result === true) {
        console.log ('Subscribed to ' + market);
      }
    });


    self.client.serviceHandlers.messageReceived = function (message) {
      let data = jsonic (message.utf8Data);
      let json;
      if (data.hasOwnProperty ('M')) {
        if (data.M[0]) {
          if (data.M[0].hasOwnProperty ('A')) {
            if (data.M[0].A[0]) {
              /**
               *  handling the GZip and base64 compression
               *  https://github.com/Bittrex/beta#response-handling
               */
              let b64 = data.M[0].A[0];
              let raw = new Buffer.from(b64, 'base64');

              zlib.inflateRaw (raw, function (err, inflated) {
                if (! err) {
                  json = JSON.parse(inflated.toString ('utf8'));
                  boundParser('ORDER_DELTA', json, market);
                }
              });
            }
          }
        }
      }
    }
  }

  parseOrderDelta(type, orderDelta, market) {
    if (type === 'ORDER_BOOK_INIT' && orderDelta['Z'] && orderDelta['S']) {
      const sortedBids = orderDelta['Z'].sort((a, b) => {
        return b.R - a.R;
      }).slice(0, this.orderBookDepth);
      const sortedAsks = orderDelta['S'].sort((a, b) => {
        return a.R - b.R;
      }).slice(0, this.orderBookDepth);
      const bids = sortedBids.reduce((aggregator, bid) => {
          let order = {
            exchange: this.exchangeName,
            market: market,
            rate: bid.R,
            amount: parseFloat(bid.Q)
          };
          aggregator[this.exchangeName + market + bid.R.toString()] = order;
          return aggregator;
      }, {})
      const asks = sortedAsks.reduce((aggregator, ask) => {
          let order = {
            exchange: this.exchangeName,
            market: market,
            rate: ask.R,
            amount: parseFloat(ask.Q)
          };
          aggregator[this.exchangeName + market + ask.R.toString()] = order;
          return aggregator;
      }, {})
      let initOrderBook = {
        type,
        market: market,
        exchange: this.exchangeName,
        bids: bids,
        asks: asks
      }
      this.emitOrderBook(initOrderBook);
    }
    if (type === 'ORDER_DELTA' && orderDelta['Z'] && orderDelta['S']) {
      orderDelta['Z'].forEach(change => {
        let orderDelta = {
          type: 'BID_UPDATE',
          market: market,
          rateString: this.exchangeName + market + change.R.toString(),
          rate: change.R,
          amount: parseFloat(change.Q)
        }
        this.emitOrderBook(orderDelta);
      });
      orderDelta['S'].forEach(change => {
        let orderDelta = {
          type: 'ASK_UPDATE',
          market: market,
          rateString: this.exchangeName + market + change.R.toString(),
          rate: change.R,
          amount: parseFloat(change.Q)
        }
        this.emitOrderBook(orderDelta);
      });

    }
  }
}

module.exports = Bittrex;