import React from 'react';
// import ReactDOM from 'react-dom';
import { Button, ButtonGroup, ButtonToolbar, Modal, Table, Card, Container, Col, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import getWeb3 from "./getWeb3";
import CouponContract from "./build/contracts/Coupon.json";

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      showRedeemModal: false,     // controls the display of redeem modal
      showTransferModal: false,   // controls the display of transfer modal
      coupon2RedeemMessage: {},   // message to be displayed in the redeem modal
      nCoupons: 0,                // number of unredeemed coupon
      web3: null,
      eventHistory: [],           // awardCouponEvent events
      myCoupons: [],              // copy of coupons (obtainde from the network)
      myAccount: null
    }
  }

  componentDidMount() {
    // Get network provider and web3 instance.
    getWeb3().then(results => {
      this.setState({
        web3: results.web3,
        accounts: results.accounts,
        network: results.network,
      })
      return this.instantiateContract()   // returns contract instance
    }).then(instance => {
      this.setState({ couponInstance: instance })
      return this.updateMyCoupons()       // returns a copy of my coupons
    }).then(myCoupons => {
      console.log(`myCoupons: ${JSON.stringify(myCoupons)}`)
      this.setState({ myCoupons: myCoupons })
      this.setState({ nCoupons: this.nCoupons() })
      return this.updateEventHistory()    // returns evnet history
    }).then(eventHistory => {
      console.log(`eventHistory: ${JSON.stringify(eventHistory)}`)
      this.setState({ eventHistory: eventHistory })
    }).catch((error) => {
      console.log(error)
      alert(error.message)
    })
  }

  instantiateContract = async () => {
    const contract = require('@truffle/contract')
    const coupon = contract(CouponContract)
    coupon.setProvider(this.state.web3.currentProvider)

    let myAccount = this.state.accounts[0]
    this.setState({ myAccount: myAccount })
    console.log(`myAccount: ${this.state.myAccount}`)

    let instance = await coupon.deployed()

    return instance
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
          <Provider networkType={this.state.network.networkType} Id={this.state.network.id} />
        </div>

        <div className="d-flex flex-row justify-content-center">
          <ContractAddress contractInstance={this.state.couponInstance} />
        </div>

        <div className="d-flex flex-row justify-content-center mt-3">
          <AccountSelector
            accounts={this.state.accounts}
            switchAccount={this.switchAccount}
            currentAccount={this.state.myAccount}
          />
        </div>

        <div className="d-flex flex-row justify-content-center" >
          <p>You have: <span className="h3 text-success font-weight-bolder">{this.state.nCoupons}</span> unused coupon(s)</p>
        </div>

        <div className="d-flex flex-row justify-content-center" >
          <Modal show={this.state.showRedeemModal} onHide={this.dismissRedeemModal}>
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
              <Button variant="secondary" onClick={this.dismissRedeemModal}>Cancel</Button>
              <Button variant="primary" onClick={this.redeem}>Redeem</Button>
            </Modal.Footer>
          </Modal >
        </div>

        <div className="d-flex flex-row justify-content-center" >
          <Modal show={this.state.showTransferModal} onHide={this.dismissTransferModal}>
            <Modal.Header closeButton>
              <Modal.Title>Transfer this Coupon?</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Form.Control
                as="select"
                className="mr-sm-2"
                id="account"
                custom
                onChange={(e) => e.target.value !== "0" && this.setTransferAccount(e.target.value)}
              >
                <option key="0" value="0">Choose...</option>
                {this.state.transferAccounts}
              </Form.Control>
            </Modal.Body >

            <Modal.Footer>
              <Button variant="secondary" onClick={this.dismissTransferModal}>Cancel</Button>
              <Button variant="primary" onClick={this.transfer}>Transfer</Button>
            </Modal.Footer>
          </Modal >
        </div>

        <div className="d-flex flex-row justify-content-center" >
          <CouponSelector
            myAccount={this.state.myAccount}
            myCoupons={this.state.myCoupons}
            setCoupon2Redeem={this.setCoupon2Redeem}
            setCoupon2Transfer={this.setCoupon2Transfer}
          />
        </div>

        <br></br>
        <div className="d-flex flex-row justify-content-center align-items-stretch" >
          <EventHistory events={this.state.eventHistory} />
        </div>

      </Container >
    );
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
    console.log(`nCoupons: ${this.nCoupons()}`)

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
    this.setState({ myAccount: account }, () => {
      this.updateMyCoupons().then(myCoupons => {
        this.setState({ myCoupons: myCoupons })
        this.setState({ nCoupons: this.nCoupons() })
      })
      this.updateEventHistory().then(eventHistory => this.setState({ eventHistory: eventHistory }))
      console.log(`switchAccount(${account}) myAccount: ${this.state.myAccount}`)
    })
  }

  dismissRedeemModal = () => {
    this.setState({ showRedeemModal: false })
  }

  displayRedeemModal = () => {
    this.setState({ showRedeemModal: true })
  }

  dismissTransferModal = () => {
    this.setState({ showTransferModal: false })
  }

  displayTransferModal = () => {
    this.setState({ showTransferModal: true })
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
        this.displayRedeemModal()
      }
    }
  }

  setCoupon2Transfer = (tokenId) => {
    let accounts = this.state.accounts.filter(account => account !== this.state.myAccount)
    let transferAccounts = accounts.map(a => {
      return <option key={a} value={a}>{a}</option>
    })
    console.log(`transferAccount: ${transferAccounts}`)
    this.setState({
      transferAccounts: transferAccounts,
      tokenId2Transfer: tokenId
    }, () => {
      this.displayTransferModal()
    })
  }

  setTransferAccount = (account) => {
    this.setState({ transferAccount: account })
  }

  transfer = async () => {
    this.dismissTransferModal()
    if (this.state.tokenId2Transfer && this.state.transferAccount) {
      await this.state.couponInstance.safeTransferFrom(
        this.state.myAccount, this.state.transferAccount, this.state.tokenId2Transfer,
        { from: this.state.myAccount }
      )
      this.updateMyCoupons().then(myCoupons => {
        this.setState({ myCoupons: myCoupons })
        this.setState({ nCoupons: this.nCoupons() })
      })
      this.updateEventHistory().then(eventHistory => this.setState({ eventHistory: eventHistory }))
      alert(`Coupon [${this.state.tokenId2Transfer}] transferred to ${this.state.transferAccount}`)
      this.setState({ transferAccount: undefined, tokenId2Transfer: undefined })
    }
  }

  redeem = async () => {
    this.dismissRedeemModal()
    if (this.state.coupon2RedeemMessage) {
      let tokenId = this.state.coupon2RedeemMessage.tokenId
      let results = await this.state.couponInstance.redeem(tokenId, { from: this.state.myAccount })
      this.updateMyCoupons().then(myCoupons => {
        this.setState({ myCoupons: myCoupons })
        this.setState({ nCoupons: this.nCoupons() })
      })
      this.updateEventHistory().then(eventHistory => this.setState({ eventHistory: eventHistory }))
      this.setState({ coupon2RedeemMessage: undefined })

      alert(`Succesfully Redeemed Coupon (${tokenId}) \rTransaction ref: \r${results.tx}`)
    }
  }

  updateEventHistory = async () => {
    // redeem events
    let events = await this.state.couponInstance.getPastEvents('redeemCouponEvent', { fromBlock: 0, toBlock: 'latest' })
    let filteredEvents = events.filter(e => e.returnValues.customer === this.state.myAccount)
    let filteredRedeemEvents = filteredEvents.map(e => {
      return ({
        event: 'redeem',
        tokenId: e.returnValues.tokenId,
        blockTimeStamp: e.returnValues.blockTimeStamp,
        transactionHash: e.transactionHash,
        remarks: ""
      })
    })

    // transfer events
    events = await this.state.couponInstance.getPastEvents('Transfer', { fromBlock: 0, toBlock: 'latest' })
    filteredEvents = events.filter(e => {
      return (
        (e.returnValues.from !== "0x0000000000000000000000000000000000000000") &&
        ((e.returnValues.from === this.state.myAccount) ||
          (e.returnValues.to === this.state.myAccount)
        )
      )
    })
    let filteredTransferEvents = []
    for (let e of filteredEvents) {
      let results = await this.state.web3.eth.getTransaction(e.transactionHash)
      let blockNumber = results.blockNumber
      results = await this.state.web3.eth.getBlock(blockNumber)
      let timestamp = results.timestamp
      let eventObject = {}
      eventObject.event = 'transfer'
      eventObject.tokenId = e.returnValues.tokenId
      eventObject.remarks =
        (e.returnValues.from === this.state.myAccount)
          ?
          `To: ${e.returnValues.to}`
          :
          `From: ${e.returnValues.from}`
      eventObject.blockTimeStamp = timestamp
      eventObject.transactionHash = e.transactionHash
      filteredTransferEvents.push(eventObject)
    }

    console.log(`filteredTransferEvents: ${JSON.stringify(filteredTransferEvents)}`)

    let history = [...filteredRedeemEvents, ...filteredTransferEvents]
    return history
  }
}  // end of App

//
// function components
//
const EventHistory = (props) => {
  if (props.events === null || props.events === undefined) {
    return < div ></div >
  }
  // let listItems = this.props.events.map((e) => <li key={e.transactionHash}>Value: {e.newValue} (was {e.oldValue})</li>)
  // return <ol>{listItems}</ol>
  let listItems = props.events.map((e) =>
    <tr key={e.transactionHash}>
      <td>{e.event}</td>
      <td>{e.tokenId}</td>
      <td>{new Date(e.blockTimeStamp * 1000).toLocaleString()}</td>
      <td>{e.remarks}</td>
    </tr>
  )
  return (
    <div >
      <div className="d-flex justify-content-center">Transaction History</div>
      <div className="d-flex justify-content-center">
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th className="col-auto">Event</th>
              <th className="col-auto">Coupon</th>
              <th className="col-auto">Date/Time</th>
              <th className="col-auto">Remarks</th>
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

const Provider = (props) => {
  return (
    (props.network === undefined || props.network === null)
      ?
      <div></div>
      :
      <div className="d-flex justify-content-center">
        <small>Connected to network: <code className="text-info">{props.networkType} (Id: {props.Id})</code></small>
      </div >
  )
}

const ContractAddress = (props) => {
  return (
    (props.contractInstance === undefined || props.contractInstance === null) ?
      <div className="d-flex justify-content-center">
        <small className="text-danger">Contract not deployed??</small>
      </div>
      :
      <div className="d-flex justify-content-center">
        <small>Contract address: <code className="text-info">{props.contractInstance.address}</code></small>
      </div>
  )
}

const CouponSelector = (props) => {
  if (!props.myCoupons || props.myCoupons === undefined || props.myCoupons === null) {
    return <div></div>
  }
  let couponItems = props.myCoupons.map(c =>
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
                  <ButtonToolbar>
                    <ButtonGroup className="mr-2">
                      <Button className variant="primary" disabled={c.redeemed} onClick={
                        (event) => {
                          props.setCoupon2Redeem(c.tokenId)
                        }}>Redeem
                      </Button>
                    </ButtonGroup>
                    <ButtonGroup className="mr-2">
                      <Button className variant="primary" disabled={c.redeemed} onClick={
                        (event) => {
                          props.setCoupon2Transfer(c.tokenId)
                        }}>Transfer
                      </Button>
                    </ButtonGroup>
                  </ButtonToolbar>
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
      </Card >
    </div >

  )
  return (
    <div class="d-flex row-cols-xl-4 row-cols-lg-3 row-cols-md-2 row row-cols-sm-1">
      {couponItems}
    </div>
  )
}

const AccountSelector = (props) => {
  if (!props.accounts || props.accounts === undefined || props.accounts === null) {
    return <div></div>
  }
  let accounts = props.accounts.map(a => {
    return <option key={a} value={a}>{a}</option>
  })
  return (
    <Form>
      <Form.Row>
        <Col xs="auto">
          <Form.Label>Account</Form.Label>
        </Col>
        <Col xs="auto">
          <Form.Control
            as="select"
            className="mr-sm-2"
            id="account"
            custom
            value={props.currentAccount}
            onChange={(e) => e.target.value !== "0" && props.switchAccount(e.target.value)}
          >
            <option key="0" value="0">Choose...</option>
            {accounts}
            {/* <option value={this.props.accounts[0]}>{this.props.accounts[0]}</option>
              <option value={this.props.accounts[1]}>{this.props.accounts[1]}</option> */}
          </Form.Control>
        </Col>
      </Form.Row>
    </Form>
  )
}

export default App;
