//const the mongoose module
var mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/algo-wallet';
mongoose.connect(mongoDB, {
    useNewUrlParser: true
}).then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

autoIncrement.initialize(db)

module.exports = { db, autoIncrement };