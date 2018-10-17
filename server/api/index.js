const express = require('express');
const router = express.Router();
const exchanges = require('../exchanges');
const ExchangeAggregator = require('../base/ExchangeAggregator');
const asyncMiddleware = require('../utils/asyncResolve');

router.get('/getMarkets', asyncMiddleware(async (req, res, next) => {
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

    const sharedMarkets = market1.filter(val1 => {
      return market2.some(val2 => {
        // Taking doge out for now
        return (val1.market === val2.market && val1.market !== 'BTC-DOGE');
      });
    });

    res.json(sharedMarkets);
  })
}));

module.exports = router;
