const * as mongoose from 'mongoose';

const Schema = mongoose.Schema

const TradeModel = new Schema({
    time: { type: Date, default: Date.now },
    type: String,
    market: String,
    rateString: String,
    rate: Number,
    amount: Number
});

const Trade = mongoose.model( 'Trade', TradeModel )

module.exports = Trade