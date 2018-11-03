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
      acc[curr.exchange].free = curr.free
      acc[curr.exchange].used = curr.used
      acc[curr.exchange].total = curr.total
      return acc
    }, {})
    return balances
  }

  looseChange() {
  }
}

module.exports = Balance