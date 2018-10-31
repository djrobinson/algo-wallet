const uuidv1 = require('uuid/v1')

class Balance {
  id:string
  constructor() {
    this.id = uuidv1()
  }

  getBalances() {
    const openBalances = await Promise.all(exchanges.map(async (exch) => {
      const balances = await getBalances(exch)
      currentBalances[exch] = balances
      // Standardize balances
      openOrders[exch] = []
      return {
        exch,
        balances
      }
    }))

    openBalances.forEach(bals => {
      console.log('What bals: ', bals)
      Object.keys(bals.balances).forEach(bal => {
        if ( bals.balances[bal].free > 0 ) {
          looseChange.push({
            exchange: bals.exch,
            coin: bal,
            amount: bals.balances[bal].free
          })
        }
      })
    })
  }

  looseChange() {

  }
}

module.exports = { Balance }