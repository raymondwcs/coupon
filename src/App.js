import React from 'react';
// import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import getWeb3 from "./getWeb3";

import CouponContract from "./build/contracts/Coupon.json";
import { Form } from 'react-bootstrap';
import { Col } from 'react-bootstrap';

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      showRedeemModal: false,     // controls the display of redeem modal
      coupon2RedeemMessage: {},   // message to be displayed in the redeem modal
      nCoupons: 0,                // number of unredeemed coupon
      web3: null,
      eventHistory: [],           // awardCouponEvent events
      myCoupons: [],              // copy of coupons (obtainde from the network)
      myAccount: null             // accounts[]
    }
  }

  componentDidMount() {
    // Get network provider and web3 instance.
    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3,
          accounts: results.accounts,
          network: results.network,
        })

        // Instantiate contract once web3 provided.
        return this.instantiateContract()   // returns contract instance
      })
      .then(instance => {
        return this.updateMyCoupons()       // returns a copy of my coupons
      })
      .then(myCoupons => {
        console.log(`myCoupons: ${myCoupons}`)
        return this.updateEventHistory()    // returns evnet history
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

    let myAccount = this.state.accounts[0]
    this.setState({ myAccount: myAccount })
    console.log(`myAccount: ${this.state.myAccount}`)

    let instance = await coupon.deployed()
    this.setState({ couponInstance: instance })

    return instance
    // let totalSupply = await instance.totalSupply()
    // let nCoupons = await instance.balanceOf(this.state.myAccount)
    // this.setState({ nCoupons: nCoupons.toNumber() })
  }

  updateMyCoupons = async () => {
    let myCoupons = []
    let x = await this.state.couponInstance.getMyCoupons({ from: this.state.myAccount });
    myCoupons = x.map(c => {
      let coupon = {}
      coupon.tokenId = c.tokenId
      coupon.description = c.description
      coupon.tokenURI = c.tokenURI
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

  switchAccount = (account) => {
    // alert(`switchAccount(${account})`)
    this.setState({ myAccount: account }, () => {
      this.updateMyCoupons()
      this.updateEventHistory()
    })
    console.log(`switchAccount(${account}) myAccount: ${this.state.myAccount}`)
  }

  dismissModal = () => {
    this.setState({ showRedeemModal: false })
  }

  displayModal = () => {
    this.setState({ showRedeemModal: true })
  }

  setCoupon2Redeem = (tokenId) => {
    for (let c of this.state.myCoupons) {
      if (c.tokenId === tokenId) {
        // prepare the modal message...
        let coupon2RedeemMessage = {}
        coupon2RedeemMessage.tokenId = tokenId
        coupon2RedeemMessage.value = c.value
        coupon2RedeemMessage.expiryDate = c.expiryDate
        coupon2RedeemMessage.description = c.description
        this.setState({ coupon2RedeemMessage: coupon2RedeemMessage })
        this.displayModal()
      }
    }
  }

  redeem = async () => {
    this.dismissModal()
    if (this.state.coupon2RedeemMessage) {
      let tokenId = this.state.coupon2RedeemMessage.tokenId
      let results = await this.state.couponInstance.redeem(tokenId, { from: this.state.myAccount })
      /*
      let updatedCoupons = [...this.state.myCoupons]    // make a copy of myCoupons
      let coupon2Update = updatedCoupons[tokenId - 1]   // make a copy of the coupon to be redeemed from myCoupons
      coupon2Update.redeemed = true
      coupon2Update.redeemedTimeStamp = new Date().getTime() / 1000
      updatedCoupons[tokenId - 1] = coupon2Update
      this.setState({ myCoupons: updatedCoupons })      // replace/update myCoupons in state

      this.setState({ nCoupons: this.nCoupons() })
      this.updateEventHistory()
      this.setState({ coupon2RedeemMessage: undefined })
      */
      this.updateMyCoupons()
      this.updateEventHistory()
      this.setState({ coupon2RedeemMessage: undefined })

      alert(`Succesfully Redeemed Coupon (${tokenId}) \rTransaction ref: \r${results.tx}`)
    }
  }

  updateEventHistory = async () => {
    this.state.couponInstance.getPastEvents('redeemCouponEvent', { fromBlock: 0, toBlock: 'latest' }).then(events => {
      console.log(JSON.stringify(events))
      let filteredEvents = events.filter(e => e.returnValues.customer === this.state.myAccount)
      let history = filteredEvents.map(e => {
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
        <div className="d-flex flex-row justify-content-center">
          <h1>Coupons</h1>
        </div>

        <div className="d-flex flex-row justify-content-center">
          <Provider network={this.state.network} />
        </div>

        <div className="d-flex flex-row justify-content-center">
          <AccountSelector accounts={this.state.accounts} switchAccount={this.switchAccount} defaultAccount={this.state.myAccount} />
        </div>

        <div className="d-flex flex-row justify-content-center" >
          <p>You have: <span className="h3 text-success font-weight-bolder">{this.state.nCoupons}</span> unused coupon(s)</p>
        </div>

        <div className="d-flex flex-row justify-content-center" >
          <Modal show={this.state.showRedeemModal} onHide={this.dismissModal}>
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
        </div>

        <div className="d-flex flex-row justify-content-center" >
          <CouponSelector
            myAccount={this.state.myAccount}
            myCoupons={this.state.myCoupons}
            setCoupon2Redeem={this.setCoupon2Redeem}
          />
        </div>

        <br></br>
        <div className="d-flex flex-row justify-content-center align-items-stretch" >
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
      <div key={c.tokenId} className="d-flex col justify-content-center align-items-stretch mt-3">
        <Card style={{ width: '18rem' }} bg={c.redeemed ? "light" : "black"}>
          <Card.Header as="h6">No. {c.tokenId}</Card.Header>
          <Card.Body>
            <Card.Title>${c.value}</Card.Title>
            <Card.Subtitle>
              {c.description}
            </Card.Subtitle>
            <div class="d-flex">
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
                    <Button className variant="primary" disabled={c.redeemed} onClick={
                      (event) => {
                        this.props.setCoupon2Redeem(c.tokenId)
                      }}>Redeem
                    </Button>
                  </div>
              }
            </div>
          </Card.Body>
          <Card.Footer class="bg-transparent">
            <div class="d-flex flex-row-reverse align-self-end mb-2 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16"
                onClick={(e) => { alert(c.tokenURI) }}
                style={{ cursor: "pointer" }}>
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
              </svg>
            </div>
          </Card.Footer>
        </Card>
      </div>

    )
    return (
      <div class="d-flex row-cols-xl-4 row-cols-lg-3 row-cols-md-2 row row-cols-sm-1">
        {couponItems}
      </div>
    )
  }
}

class AccountSelector extends React.Component {
  render() {
    // let accounts = this.props.accounts.map(a => {
    //   return <option value={a}>{a}</option>
    // })
    return (
      <Form>
        <Form.Row className="align-items-center">
          <Col xs="auto">
            <Form.Label htmlFor="account">
              Account
            </Form.Label>
          </Col>
          <Col xs="auto">
            <Form.Control
              as="select"
              className="mr-sm-2"
              id="account"
              custom
              value={this.props.defaultAccount}
              onChange={(e) => this.props.switchAccount(e.target.value)}
            >
              {/* <option value="0">Choose...</option> */}
              {/* {accounts} */}
              <option value={this.props.accounts[0]}>{this.props.accounts[0]}</option>
              <option value={this.props.accounts[1]}>{this.props.accounts[1]}</option>
            </Form.Control>
          </Col>
        </Form.Row>
      </Form>
    )
  }
}

export default App;
