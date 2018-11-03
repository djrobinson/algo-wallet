const uuidv1 = require('uuid/v1')
const ccxt = require ('ccxt')
const { exchanges, exchangesMap } = require('../exchanges')

class Balance {

  constructor() {
    this.id = uuidv1()
  }

  async getBalances() {
    const openBalances = await Promise.all(exchanges.map(async (exch) => {
      const balances = await exchangesMap[exch].getBalances(exch)
      currentBalances[exch] = balances
      // Standardize balances
      openOrders[exch] = []
      return {
        exch,
        balances
      }
    }))
    return openBalances
    // openBalances.forEach(bals => {
    //   console.log('What bals: ', bals)
    //   Object.keys(bals.balances).forEach(bal => {
    //     if ( bals.balances[bal].free > 0 ) {
    //       looseChange.push({
    //         exchange: bals.exch,
    //         coin: bal,
    //         amount: bals.balances[bal].free
    //       })
    //     }
    //   })
    // })
  }

  looseChange() {
  }
  async getBalances (exchange) {

  try {
      // fetch account balance from the exchange, save to global variable
      const currentBalances = await exchange.fetchBalance()
      log.bright.lightGreen ( "Initial Balances: ", currentBalances )
      return currentBalances
  } catch (e) {
      if (e instanceof ccxt.DDoSProtection || e.message.includes ('ECONNRESET')) {
          log.bright.yellow ('[DDoS Protection] ' + e.message)
      } else if (e instanceof ccxt.RequestTimeout) {
          log.bright.yellow ('[Request Timeout] ' + e.message)
      } else if (e instanceof ccxt.AuthenticationError) {
          log.bright.yellow ('[Authentication Error] ' + e.message)
      } else if (e instanceof ccxt.ExchangeNotAvailable) {
          log.bright.yellow ('[Exchange Not Available Error] ' + e.message)
      } else if (e instanceof ccxt.ExchangeError) {
          log.bright.yellow ('[Exchange Error] ' + e.message)
      } else if (e instanceof ccxt.NetworkError) {
          log.bright.yellow ('[Network Error] ' + e.message)
      } else {
          throw e
      }
  }
}
}

module.exports = Balance