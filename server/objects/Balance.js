const uuidv1 = require('uuid/v1')
const ccxt = require ('ccxt')
const balanceModel = require('../db/models/balance.model');

class Balance {

  constructor(exchanges) {
    this.id = uuidv1()
    this.exchanges = exchanges
  }

  async getBalances() {
    const openBalances = await Promise.all(this.exchanges.map(async (exch) => {
      console.log("What is exchange: ", exch.exchangeName)
      const rawBalances = await exch.fetchBalance()
      // Standardize rawBalances
      const balForSave = {
        exchange: exch.exchangeName,
        free: rawBalances.free,
        used: rawBalances.used,
        total: rawBalances.total
      }
      const balanceInstance = new balanceModel(balForSave)

      balanceInstance.save((err) => {
        if (err) console.log("There was an error saving  instance")
        console.log("Save of balance successful")
      })
      return balForSave
    }))
    let balances = openBalances.reduce((acc, curr) => {
      acc[curr.exchange] = {}
      acc[curr.exchange].free = Object.keys(curr.free).reduce((a, b) => {
        if (curr.free[b] > 0) {
          a[b] = curr.free[b]
          return a
        }
        return a
      }, {})
      acc[curr.exchange].used = Object.keys(curr.used).reduce((a, b) => {
        if (curr.used[b] > 0) {
          a[b] = curr.used[b]
          return a
        }
        return a
      }, {})
      acc[curr.exchange].total = Object.keys(curr.total).reduce((a, b) => {
        if (curr.total[b] > 0) {
          a[b] = curr.total[b]
          return a
        }
        return a
      }, {})
      return acc
    }, {})
    return balances
  }

  looseChange() {
  }
}

module.exports = Balance