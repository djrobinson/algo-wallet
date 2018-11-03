const Bittrex = require('./integrations/exchanges/Bittrex');
const Poloniex = require('./integrations/exchanges/Poloniex');

const exchangesMap = {
  'bittrex': Bittrex,
  'poloniex': Poloniex
}

module.exports = exchangesMap