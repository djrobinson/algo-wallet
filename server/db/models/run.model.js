import * as mongoose from 'mongoose';

const Schema = mongoose.Schema

const RunModel = new Schema({
    time: { type: Date, default: Date.now },
    markets: Array,
    exchanges: Array,
    tradeCount: Number,
    openedOrdersCount: Number,
    alpha: Number
});

const Run = mongoose.model( 'Run', RunModel )

module.exports = Run