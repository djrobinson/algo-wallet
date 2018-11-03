const uuidv1 = require('uuid/v1')
const ccxt = require ('ccxt')

class Balance {

  constructor(exchanges) {
    this.id = uuidv1()
    this.exchanges = exchanges
  }

  async getBalances() {
    const openBalances = await Promise.all(this.exchanges.map(async (exch) => {
      console.log("What is exchange: ", exch.exchangeName)
      const balances = await exch.fetchBalance()
      // Standardize balances
      return {
        exchange: exch.exchangeName,
        free: balances.free,
        used: balances.used,
        total: balances.total
      }
    }))
    return openBalances.reduce((acc, curr) => {
      acc[curr.exchange] = {}
      acc[curr.exchange].free = curr.free
      acc[curr.exchange].used = curr.used
      acc[curr.exchange].total = curr.total
      return acc
    }, {})
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
}

module.exports = Balance