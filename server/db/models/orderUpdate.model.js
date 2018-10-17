const mongoose = require('mongoose')

const Schema = mongoose.Schema

const OrderUpdateModel = new Schema({
    time: { type: Date, default: Date.now },
    type: String,
    market: String,
    rateString: String,
    rate: Number,
    amount: Number
});

const OrderUpdate = mongoose.model( 'OrderUpdate', OrderUpdateModel )

module.exports = OrderUpdate