const  express = require('express')
const router = express.Router();
const exchanges = require('../exchanges')
const Run = require('../objects/Run')
const  asyncMiddleware = require('../utils/asyncResolve')
const ConnectionManager = require('../integrations/ConnectionManager')

router.get('/getMarkets', async (req, res, next) => {
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
    const sharedMarkets = market1.filter((val1) => {
      return market2.some((val2) => {
        // Taking doge out for now
        return (val1.market === val2.market && val1.market !== 'BTC-DOGE');
      });
    });
    res.json(sharedMarkets);
  })
});

// router.get('/getBalances', asyncMiddleware(async (req, res, next) => {

// }))

// router.post('/setTradeStrategy', asyncMiddleware(async (req, res, next) => {

// }))

router.post('/startRun', async (req, res, next) => {
  const markets = req.body.markets
  const exchanges = req.body.exchanges
  const connection = new ConnectionManager(markets, exchanges)

  // Is it possible to register the websocket client to emit messages back to here?

})

module.exports = router;
