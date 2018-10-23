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

  }

  render() {
    return (
      <div className="App">
        <TradeEngine />
      </div>
    );
  }
}

export default App;