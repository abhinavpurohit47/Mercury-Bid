import React, { Component } from 'react';
import Image from 'react-bootstrap/lib/Image';
import BidHistory from './BidHistory';

const io = require('socket.io-client');
const socket = io();

class DetailList extends Component {
  constructor(props) {
    super(props);
    this.state = {bidHistory:[],timeRemain:0} 
  } 
  componentDidMount() { 
    this.getBidHistory();
    var self = this; 
    
    socket.on('updateBid', function(bidObj){
      self.setState({bidHistory:bidObj});
      
    }); 
   
    socket.emit('getTime', 'test');
    //handle to listen 'remaining time' from server socket
    socket.on('remainingTime', function(timeFromServer){     
      self.setState({timeRemain:timeFromServer}); 
    });     
  }

  getBidHistory = () => {
    fetch('/api/bidhistory')
      .then(res => res.json())
      .then(bidHistory => this.setState({bidHistory}));
  }

  saveBid(bidhistory, liveStockID) { 
    this.state.bidHistory[liveStockID] = bidhistory;
    fetch('/api/bidhistory',{method:"POST",headers: new Headers({'content-type':'application/json'}), dataType:'json', body:JSON.stringify(this.state.bidHistory)})
     .then(res => res.json())
     .then(bidhistory => this.setState({bidhistory}));

  }

  render() {
    var self = this;
  	var detailsNodes = this.props.data.map(function(details) {
       var bidSort;
       if(Object.keys(self.state.bidHistory).length !== 0) {
         self.bidHistoryObj = self.state.bidHistory[details.id];         
         bidSort = Object.keys(self.bidHistoryObj)
                              .sort((a,b) =>self.bidHistoryObj[b]-self.bidHistoryObj[a])
                              .reduce((obj, key)=>({...obj, [key]: self.bidHistoryObj[key]}), {});
       }      
      return (
        <Details
          breed={details.breed}
          key = {details.id} 
          id ={details.id}
          basePrice={details.basePrice}
          image={details.image}
          bidHistory = {bidSort}  
          saveBid = {self.saveBid.bind(self)}
          userName = {self.props.userName}
          timeFromServer = {self.state.timeRemain}      

        >
         
        </Details>
      );
    });
    return (
      <div className = "detailsList">
       {this.state.bidHistory.length !== 0 &&
          <div className="row">          
            {detailsNodes}         
          </div>
         }
      </div>
    );
  }
}


class Details extends Component {
  constructor(props) {
    super(props);
    this.state = {bidPrice:'',inputValue:'', showBidInput: true};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({inputValue: event.target.value});
  }

  handleSubmit(event) {    
    var bidHistoryObj = this.props.bidHistory;
    bidHistoryObj[this.props.userName] = this.state.inputValue;
    event.preventDefault();
    this.props.saveBid(bidHistoryObj,this.props.id);
    this.setState({showBidInput:false});

  }

  reBid(event) {
    this.setState({showBidInput:true});
  }

   render() {
    const imgUrl = require(`./assets/${this.props.image}`);
    return (
      <div class="row">
      <div className="col-md-4">
        <div className="bid-detail-div">
          <div className="row">
            <div className="col-md-12">
              <Image src={imgUrl} width="100%" height="100%" rounded />
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 ">
              <div>
                <div className="livestock-info justify-content-centre">
                  <h5>{this.props.breed} - {this.props.id}</h5>
                  <h5>Base Price - ${this.props.basePrice}</h5>
              
                </div>
                {this.props.userName !=='' && 
                  <div>
                    {this.state.showBidInput ?(
                    <form className="form-inline bid-form" onSubmit={this.handleSubmit}> 
                      {this.props.timeFromServer >0 &&
                        <div>
                          <div className="form-group mx-sm-3" >                  
                            <input id="inputBid" className="form-control" type="number" placeholder="Your Price" min={this.props.basePrice} value={this.state.inputValue} onChange={this.handleChange} />                  
                          </div>
                          <br></br>
                        <input type="submit" className="btn btn-primary bid-submit-btn" value="Bid" />
                      </div>
                       }
                    </form>
                    ):(
                      <input type="button" className="btn btn-primary rebid-input" value="ReBid" onClick={this.reBid.bind(this)}/>
                    )
                   }
                   
                  </div>
                }
              </div>
            </div>       
          </div>
          <div className = "row bid-history-div">
            {Object.keys(this.props.bidHistory).length > 0 &&
              <div>
                <h4 className="bid-history-header ">Bid History</h4>
                <BidHistory bidHistory={this.props.bidHistory} ></BidHistory>
              </div>
             }
          </div>
        </div>
      </div>
      </div>
    );

   }

}



export default DetailList;