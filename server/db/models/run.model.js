const mongoose = require('mongoose');
const { autoIncrement } = require('../db')

const Schema = mongoose.Schema

const RunModel = new Schema({
    time: { type: Date, default: Date.now },
    markets: Array,
    exchanges: Array,
    tradeCount: Number,
    openedOrdersCount: Number,
    alpha: Number
})

RunModel.plugin(autoIncrement.plugin, 'Run')

const Run = mongoose.model( 'Run', RunModel )

module.exports = Run