import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import './BalancesTile.css';

class BalancesTile extends Component {


  render() {
    return (
      <div className="balances-tile-container">
        <h1>{this.props.mkt}</h1>
        <div className="exchanges">
          {(this.props.exchanges.length) && (this.props.exchanges.map((exch, i) => {
            return (
                <div className="exchange-balance-container" key={i}>
                  <h5>{exch}</h5>
                  <span className="total">{this.props.balances[exch] ? this.props.balances[exch].total : 0.00}</span>
                  <span className="used">{this.props.balances[exch] ? this.props.balances[exch].used : 0.00}</span>
                  <span className="free">{this.props.balances[exch] ? this.props.balances[exch].free : 0.00 }</span>
                </div>
              )
          }))
        }
        </div>
      </div>
    );
  }
}

export default BalancesTile;