const mongoose = require('mongoose');
const { autoIncrement } = require('../db')

const Schema = mongoose.Schema

const OrderBookInitModel = new Schema({
    time: { type: Date, default: Date.now },
    runId: { type: Number, ref: 'Run'},
    market: String,
    exchange: String,
    bids: Object,
    asks: Object
})

OrderBookInitModel.plugin(autoIncrement.plugin, 'Run')
OrderBookInitModel.plugin(autoIncrement.plugin, 'OrderBookInitModel')

const OrderBookInit = mongoose.model( 'OrderBookInit', OrderBookInitModel )

module.exports = OrderBookInit