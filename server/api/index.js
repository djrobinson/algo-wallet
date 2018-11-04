const  express = require('express')
const router = express.Router();
const exchangesMap = require('../exchanges')
const Run = require('../objects/Run')
const Balance = require('../objects/Balance')
const Bittrex = require('../integrations/exchanges/Bittrex')
const Poloniex = require('../integrations/exchanges/Poloniex')
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

router.get('/getBalances', async (req, res, next) => {
  const reqExchanges = ['bittrex', 'poloniex']
  const exchanges = reqExchanges.map(exch => new exchangesMap[exch]())
  const balance = new Balance(exchanges)
  const balances = await balance.getBalances()
  res.json(balances)
})

// router.post('/setTradeStrategy', asyncMiddleware(async (req, res, next) => {

// }))

module.exports = router;
