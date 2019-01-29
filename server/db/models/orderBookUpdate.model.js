const  mongoose = require('mongoose');
const { autoIncrement } = require('../db')

const Schema = mongoose.Schema

const OrderBookUpdateModel = new Schema({
    time: { type: Date, default: Date.now },
    runId: { type: Number, ref: 'Run'},
    type: String,
    market: String,
    rateString: String,
    rate: Number,
    amount: Number
});

OrderBookUpdateModel.plugin(autoIncrement.plugin, 'Run')
OrderBookUpdateModel.plugin(autoIncrement.plugin, 'OrderBookInitModel')

const OrderBookUpdate = mongoose.model( 'OrderBookUpdate', OrderBookUpdateModel )

module.exports = OrderBookUpdate