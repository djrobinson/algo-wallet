import * as mongoose from 'mongoose';

const Schema = mongoose.Schema

const OrderBookInitModel = new Schema({
    time: { type: Date, default: Date.now },
    market: String,
    exchange: String,
    bids: Object,
    asks: Object
})

const OrderBookInit = mongoose.model( 'OrderBookInit', OrderBookInitModel )

module.exports = OrderBookInit