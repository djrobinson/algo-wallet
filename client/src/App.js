import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import OrderBook from './OrderBook';
import './App.css';

class App extends Component {
  state = {
    markets: [],
    showOrderBook: false,
    selectedMarket: ''
  }

  componentDidMount() {
    fetch('/api/getMarkets')
      .then(res => res.json())
      .then(data => {
        this.setState({ markets: data })
      });
  }

  selectMarket(mkt) {
    console.log("Selecting market", mkt);
    this.setState({ selectedMarket: mkt })
  }

  render() {
    return (
      <div className="App">
        <Row className="header-row">
          <div className="header">
            <h1>ARBWATCH</h1>
          </div>
        </Row>
        <Row>
          <Col md={4} className="coin-tiles">
            {
              this.state.markets.map((market, i) => {
                return (
                  <Col md={4} className="coin-col" key={i} >
                    <div className="coin-tile" onClick={() => {this.selectMarket(market.market)}}>

                      <img src={market.logo ? market.logo : ''} alt="" height="75px" width="75px" />
                      <h4>{market.market}</h4>
                    </div>
                  </Col>
                );
              })
            }
          </Col>
          <Col md={8} className="main-panel">
            {
              (this.state.selectedMarket) && (
                <OrderBook market={this.state.selectedMarket} />
              )
            }
            {
              (!this.state.selectedMarket) && (
                <div className="welcome">
                  <h1>Select a trading pair to get started!</h1>
                </div>
              )
            }
          </Col>
        </Row>
      </div>
    );
  }
}

export default App;