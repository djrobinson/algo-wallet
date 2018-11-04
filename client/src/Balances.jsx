import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import OrderBook from './OrderBook';
import './Balances.css';

class Balances extends Component {
  state = {
    markets: [],
    showOrderBook: false,
    selectedMarket: ''
  }

  componentDidMount() {
    fetch('/api/getBalances')
      .then(res => res.json())
      .then(data => {
        this.setState({
          markets: data.markets,
          balances: data
        })
        console.log("What is data from balances: ", data)
      });
  }

  render() {
    return (
      <div className="balances-container">
        {
          (this.state.markets.length) && (
            this.state.markets.map(mkt => <h1>{mkt}</h1>)
          )
        }
      </div>
    );
  }
}

export default Balances;