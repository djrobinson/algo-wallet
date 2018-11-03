import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import OrderBook from './OrderBook';
import TradeEngine from './TradeEngine';
import './App.css';

class App extends Component {
  state = {
    markets: [],
    showOrderBook: false,
    selectedMarket: ''
  }

  componentDidMount() {
    fetch('/api/getBalances')
      .then(res => res.json())
      .then(data => {
        console.log("What is data from balances: ", data)
      });
  }

  render() {
    return (
      <div className="App">
        <h1>Algo Wallet</h1>

      </div>
    );
  }
}

export default App;