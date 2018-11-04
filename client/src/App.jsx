import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import OrderBook from './OrderBook';
import TradeEngine from './TradeEngine';
import Balances from './Balances'
import './App.css';

class App extends Component {
  state = {
    markets: [],
    showOrderBook: false,
    selectedMarket: ''
  }

  componentDidMount() {
  }

  render() {
    return (
      <div className="App">
        <Balances />

      </div>
    );
  }
}

export default App;