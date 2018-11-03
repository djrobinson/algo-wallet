const Bittrex = require('./integrations/exchanges/Bittrex');
const Poloniex = require('./integrations/exchanges/Poloniex');

const exchangesMap = {
  'bittrex': Bittrex
}
const exchanges = Object.keys(exchangesMap)
module.exports = { exchanges, exchangesMap }