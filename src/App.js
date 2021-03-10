import React from 'react';
// import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
// import Form from 'react-bootstrap/Form';
// import FormControl from 'react-bootstrap/FormControl';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import { CardGroup } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
// import InputGroup from 'react-bootstrap/InputGroup';
// import logo from './logo.svg';
// import './App.css';
import getWeb3 from "./getWeb3";

import CouponContract from "./build/contracts/Coupon.json";

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      showMode: false,
      nCoupons: 0,
      web3: null,
      eventHistory: [],
      myCoupons: [],
      coupon2RedeemMessage: {},
      myAccount: null
    }
  }

  componentDidMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3,
          accounts: results.accounts,
          network: results.network,
        })

        // Instantiate contract once web3 provided.
        return this.instantiateContract()
      })
      .then(myCoupons => {
        console.log(`myCoupons: ${myCoupons}`)
        return this.updateEventHistory()
      })
      .then(eventHistory => {
        console.log(`eventHistory: ${eventHistory}`)
      })
      .catch((error) => {
        console.log(error)
        alert(error.message)
      })
  }

  async instantiateContract() {
    const contract = require('@truffle/contract')
    const coupon = contract(CouponContract)
    coupon.setProvider(this.state.web3.currentProvider)

    // Declaring this for later so we can chain functions on coupon.
    // var couponInstance
    let myAccount = this.state.accounts[0]
    this.setState({ myAccount: myAccount })
    console.log(`myAccount: ${this.state.myAccount}`)

    let instance = await coupon.deployed()
    this.setState({ couponInstance: instance })
    // let totalSupply = await instance.totalSupply()

    // let nCoupons = await instance.balanceOf(this.state.myAccount)
    // this.setState({ nCoupons: nCoupons.toNumber() })

    let myCoupons = []
    let x = await instance.getMyCoupons({ from: this.state.myAccount });
    myCoupons = x.map(c => {
      let coupon = {}
      coupon.tokenId = c.tokenId
      coupon.description = c.description
      coupon.value = c.value
      coupon.expiryDate = c.expiryDate
      coupon.redeemed = c.redeemed
      coupon.redeemedTimeStamp = c.redeemedTimeStamp
      return coupon
    })
    console.log(`myCoupons: ${myCoupons}`)
    this.setState({ myCoupons: myCoupons })

    console.log(`nCoupons: ${this.nCoupons()}`)
    this.setState({ nCoupons: this.nCoupons() })

    return myCoupons
  }

  nCoupons = () => {
    let nCoupons = 0
    for (let c of this.state.myCoupons) {
      if (!c.redeemed && c.tokenId !== 0) nCoupons++
    }
    return nCoupons
  }

  dismissModal = () => {
    this.setState({ showMode: false })
  }

  displayModal = () => {
    this.setState({ showMode: true })
  }

  setCoupon2Redeem = (tokenId) => {
    let coupon2Redeem = this.state.myCoupons
    let coupon2RedeemMessage = {}
    coupon2RedeemMessage.tokenId = tokenId
    coupon2RedeemMessage.value = coupon2Redeem[tokenId - 1].value
    coupon2RedeemMessage.expiryDate = coupon2Redeem[tokenId - 1].expiryDate
    coupon2RedeemMessage.description = coupon2Redeem[tokenId - 1].description
    this.setState({ coupon2RedeemMessage: coupon2RedeemMessage })
    this.displayModal()
  }

  redeem = async () => {
    this.dismissModal()
    if (this.state.coupon2RedeemMessage) {
      let tokenId = this.state.coupon2RedeemMessage.tokenId
      let results = await this.state.couponInstance.redeem(tokenId, { from: this.state.myAccount })
      let updatedCoupons = [...this.state.myCoupons]
      let coupon2Update = updatedCoupons[tokenId - 1]
      coupon2Update.redeemed = true
      coupon2Update.redeemedTimeStamp = new Date().getTime() / 1000
      updatedCoupons[tokenId - 1] = coupon2Update
      this.setState({ myCoupons: updatedCoupons })

      this.setState({ nCoupons: this.nCoupons() })
      this.updateEventHistory()
      this.setState({ coupon2RedeemMessage: undefined })

      alert(`Succesfully Redeemed Coupon (${tokenId}) \rTransaction ref: \r${results.tx}`)
    }
  }

  updateEventHistory = async () => {
    this.state.couponInstance.getPastEvents('redeemCouponEvent', { fromBlock: 0, toBlock: 'latest' }).then(events => {
      console.log(JSON.stringify(events))
      let history = events.map(e => {
        return ({
          transactionHash: e.transactionHash,
          tokenId: e.returnValues.tokenId,
          blockTimeStamp: e.returnValues.blockTimeStamp
        })
      })
      this.setState({ eventHistory: history })
      return history
    })
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    return (
      <Container>
        <div className="row d-flex justify-content-center">
          <h1>Coupons</h1>
        </div>

        <div className="row d-flex justify-content-center">
          <Provider network={this.state.network} />
        </div>

        <div className="row d-flex justify-content-center" >
          <p>You have: <span className="h3 text-success font-weight-bolder">{this.state.nCoupons}</span> unused coupon(s)</p>
        </div>

        <Modal show={this.state.showMode} onHide={this.dismissModal}>
          <Modal.Header closeButton>
            <Modal.Title>Redeem this Coupon?</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <p className="h6">No. <span className="font-weight-bolder">
              {(typeof this.state.coupon2RedeemMessage === "undefined") ? "" : this.state.coupon2RedeemMessage.tokenId}</span>
            </p>
            <ul>
              <li>{(typeof this.state.coupon2RedeemMessage === "undefined") ? "" : this.state.coupon2RedeemMessage.description}</li>
              <li>Value: {(typeof this.state.coupon2RedeemMessage === "undefined") ? "" : this.state.coupon2RedeemMessage.value}</li>
              <li>Expiry Date: {(typeof this.state.coupon2RedeemMessage === "undefined") ? "" : this.state.coupon2RedeemMessage.expiryDate}</li>
            </ul>
          </Modal.Body >

          <Modal.Footer>
            <Button variant="secondary" onClick={this.dismissModal}>Cancel</Button>
            <Button variant="primary" onClick={this.redeem}>Redeem</Button>
          </Modal.Footer>
        </Modal >

        <div className="row d-flex justify-content-center" >
          <CouponSelector myCoupons={this.state.myCoupons} setCoupon2Redeem={this.setCoupon2Redeem} />
        </div>

        <br></br>
        <div className="row d-flex justify-content-center" >
          <EventHistory events={this.state.eventHistory} />
        </div>

      </Container >
    );
  }
}

class EventHistory extends React.Component {
  render() {
    if (this.props.events.length === 0) {
      return < div ></div >
    }
    // let listItems = this.props.events.map((e) => <li key={e.transactionHash}>Value: {e.newValue} (was {e.oldValue})</li>)
    // return <ol>{listItems}</ol>
    let listItems = this.props.events.map((e) =>
      <tr key={e.transactionHash}>
        <td>{e.tokenId}</td>
        <td>{e.transactionHash}</td>
        <td>{new Date(e.blockTimeStamp * 1000).toLocaleString()}</td>
      </tr>
    )
    return (
      <div >
        <div className="d-flex justify-content-center">Redeem History</div>
        {/* <div className="d-flex justify-content-center table-wrapper-scroll-y my-custom-scrollbar"> */}
        <div className="d-flex justify-content-center">
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th className="col-auto">Coupon No.</th>
                <th className="col-auto">Tx Hash</th>
                <th className="col-auto">Date/Time</th>
              </tr>
            </thead>
            <tbody>
              {listItems}
            </tbody>
          </Table>
        </div>
      </div>
    )
  }
}

class Provider extends React.Component {
  render() {
    return (
      <div>
        <h6>Connected to network: <code>{this.props.network.name}</code></h6>
      </div >
    )
  }
}

class CouponSelector extends React.Component {
  render() {
    let couponItems = this.props.myCoupons.map(c =>
      <div key={c.tokenId} className="col-sm-12 col-md-6 col-lg-6 mt-3">
        {/* <div key={c.tokenId} className="col-sm-12 col-md-6 col-lg-4 d-flex align-self-stretch"> */}
        <Card style={{ width: '18rem' }} bg={c.redeemed ? "light" : "black"}>
          <Card.Header>No. {c.tokenId}</Card.Header>
          <Card.Body>
            <Card.Title>${c.value}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{c.description}</Card.Subtitle>
            {/* <Card.Text>{c.description}</Card.Text> */}
            {
              c.redeemed ?
                <Card.Text>
                  <span className="text-success font-weight-bold">Redemmed</span><br></br>
                  <small>{new Date(c.redeemedTimeStamp * 1000).toLocaleString()}</small>
                </Card.Text>
                :
                <div>
                  <Card.Text>
                    Expiry Date: {c.expiryDate}
                  </Card.Text>
                  <Button className variant="primary" disabled={c.redeemed} onClick={(e) => {
                    e.preventDefault()
                    this.props.setCoupon2Redeem(c.tokenId)
                  }}>Redeem
                </Button>
                </div>
            }
          </Card.Body>
        </Card>
      </div >
    )
    return (
      <CardGroup>
        {/* <div className="div d-flex align-items-stretch justify-content-center "> */}
        {couponItems}
      </CardGroup>
    )
  }
}

export default App;
