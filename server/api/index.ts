const express = require('express');
const router = express.Router();
const exchanges = require('../exchanges');
const ExchangeAggregator = require('../base/ExchangeAggregator');
const asyncMiddleware = require('../utils/asyncResolve');
const ConnectionManager = require('../integrations/ConnectionManager')

router.get('/getMarkets', asyncMiddleware(async (req:any, res:any, next:any) => {
  const exchangeStrings = Object.keys(exchanges);
  console.log("Trying home");
  const promisedExchanges = exchangeStrings.map(async (exch) => {
    const exchange = new exchanges[exch]();
    return await exchange.getMarket();
  })
  Promise.all(promisedExchanges).then(markets => {
    let market1 = markets.filter(mkt => mkt[0].hasOwnProperty('logo'))[0];
    // Will  need to rework this if more than 2 exchanges
    let market2 = markets.filter(mkt => !mkt[0].hasOwnProperty('logo'))[0];
    const sharedMarkets = market1.filter((val1:any) => {
      return market2.some((val2:any) => {
        // Taking doge out for now
        return (val1.market === val2.market && val1.market !== 'BTC-DOGE');
      });
    });
    res.json(sharedMarkets);
  })
}));

router.get('/getBalances', asyncMiddleware(async (req:any, res:any, next:any) => {

}))

router.post('/setTradeStrategy', asyncMiddleware(async (req:any, res:any, next:any) => {

}))

router.post('/startRun', asyncMiddleware(async (req:any, res:any, next:any) => {
  const markets = req.body.markets
  const exchanges = req.body.exchanges
  const connection = new ConnectionManager(markets, exchanges)

  // Is it possible to register the websocket client to emit messages back to here?

}))

module.exports = router;
