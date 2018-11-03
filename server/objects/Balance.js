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
      const balances = await exch.getBalance(exch)
      // Standardize balances
      return {
        exchange: exch.exchangeName,
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
}

module.exports = Balance