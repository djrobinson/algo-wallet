const uuidv1 = require('uuid/v1')
const ccxt = require ('ccxt')
const balanceModel = require('../db/models/balance.model');

class Balance {

  constructor(exchanges) {
    this.id = uuidv1()
    this.exchanges = exchanges
  }
  async getBalances() {
    let allMarkets = []
    const openBalances = await Promise.all(this.exchanges.map(async (exch) => {
      console.log("What is exchange: ", exch.exchangeName)
      const rawBalances = await exch.fetchBalance()
      // Standardize rawBalances
      const exchBals = Object.keys(rawBalances.total).reduce((a, b) => {

        if (rawBalances.total[b] > 0) {
          if (allMarkets.indexOf(b) === -1) {
            allMarkets.push(b)
          }
          a.markets[b] = {
            total: rawBalances.total[b],
            free: rawBalances.free[b],
            used: rawBalances.used[b]
          }
          return a
        }
        return a
      }, {
        exchange: exch.exchangeName,
        markets: {}
      })
      const balanceInstance = new balanceModel(exchBals)

      balanceInstance.save((err) => {
        if (err) console.log("There was an error saving  instance")
        console.log("Save of balance successful")
      })
      return exchBals
    }))
    console.log("What are all markets: ", allMarkets)
    const finalBalances = allMarkets.reduce((acc, mkt) => {
      acc[mkt] = openBalances.reduce((a, b, i) => {
        a[b.exchange] = openBalances[i].markets[mkt]
        return a
      }, {})
      return acc
    }, {
      markets: allMarkets
    })
    return finalBalances
  }

  looseChange() {
  }
}

module.exports = Balance