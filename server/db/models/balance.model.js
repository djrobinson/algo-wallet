/*
  Balance exists outside of a run
  It can be allocated to a run, but will be periodically tracked
  This is to have many different runs using a single balance that is independently
  tracked to assure our trade performance records add up
*/
const mongoose = require('mongoose');

const Schema = mongoose.Schema

const BalanceModel = new Schema({
    time: { type: Date, default: Date.now },
    exchange: String,
    markets: Object
})

const Balance = mongoose.model( 'Balance', BalanceModel )

module.exports = Balance