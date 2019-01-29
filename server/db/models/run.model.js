const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const db = require('../db')

const Schema = mongoose.Schema

autoIncrement.initialize(db)

const RunModel = new Schema({
    time: { type: Date, default: Date.now },
    markets: Array,
    exchanges: Array,
    tradeCount: Number,
    openedOrdersCount: Number,
    alpha: Number
})

RunModel.plugin(autoIncrement.plugin, { model: 'Run', field: 'runId' })

const Run = mongoose.model( 'Run', RunModel )

module.exports = Run