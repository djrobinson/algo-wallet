const  mongoose = require('mongoose');

const Schema = mongoose.Schema

const OrderDeltaModel = new Schema({
    time: { type: Date, default: Date.now },
    type: String,
    market: String,
    rateString: String,
    rate: Number,
    amount: Number
});

const OrderDelta = mongoose.model( 'OrderDelta', OrderDeltaModel )

module.exports = OrderDelta