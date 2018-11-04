import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import './BalancesTile.css';

class BalancesTile extends Component {


  render() {
    return (
      <div className="balances-tile-container">
        <h1>{this.props.mkt}</h1>
        <div className="exchanges">
          <div className="exchange-balance-container">
            <h5>Bittrex</h5>
            <span className="total">{this.props.balances.bittrex ? this.props.balances.bittrex.total : 0.00}</span>
            <span className="used">{this.props.balances.bittrex ? this.props.balances.bittrex.used : 0.00}</span>
            <span className="free">{this.props.balances.bittrex ? this.props.balances.bittrex.free : 0.00 }</span>
          </div>
          <div className="exchange-balance-container">
            <h5>Poloniex</h5>
            <span className="total">{this.props.balances.poloniex ? this.props.balances.poloniex.total : 0.00}</span>
            <span className="used">{this.props.balances.poloniex ? this.props.balances.poloniex.used : 0.00}</span>
            <span className="free">{this.props.balances.poloniex ? this.props.balances.poloniex.free : 0.00}</span>
          </div>
        </div>
      </div>
    );
  }
}

export default BalancesTile;