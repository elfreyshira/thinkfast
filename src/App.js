import React, { Component } from 'react';
import firebase from './util/firebase';
import _ from 'lodash';
window._ = _;
import getRoomID from './util/getRoomID';
import queryString from 'query-string';
import {PROGRESS} from './util/constants';

import Button from './components/Button';

import './App.css';

class App extends Component {

  state = {
    roomData: {}, // straight from firebase
    currentPlayer: '' // String
  }

  componentDidMount = () => {
    const roomID = getRoomID();
    if (roomID) {
      firebase.onUpdate(roomID, this.onFirebaseUpdate);
    }
  }

  onFirebaseUpdate = (newRoomData) => {
    console.log(newRoomData);

    const parsedHash = queryString.parse(window.location.hash);
    if (_.size(newRoomData.players) === 1 && parsedHash.first) {
      delete parsedHash.first
      window.location.hash = queryString.stringify(parsedHash);

      const currentPlayerUsername = _.keys(newRoomData.players)[0]
      this.setState({currentPlayer: currentPlayerUsername});
    }
    this.setState({roomData: newRoomData});
  }

  onStartNewGame = async () => {
    const newRoomID = await firebase.startNewGame(this.refs.newGameUsername.value)
    window.location.hash = 'room=' + newRoomID + '&first=true';
    window.location.reload();
  }
  onJoinGame = async () => {
    const newPlayerUsername = this.refs.joinUsername.value;
    await firebase.joinGame(newPlayerUsername)
    this.setState({currentPlayer: newPlayerUsername})
  }

  onBeginGame = async () => {
    await firebase.beginGame()
  }

  onSubmitSeedWord = () => {
    const seedWord = this.refs.seedWord.vlaue
    firebase.submitSeedWord(seedWord)
  }

  renderSeedInput = () => {
    const roundKey = _.get(this.state, 'roomData.status.currentRound')
    const seedPlayer = _.get(this.state, 'roomData.rounds.' + roundKey + '.seed.player')
    if (seedPlayer && seedPlayer === this.state.currentPlayer) {
      return (
        <div>
          <h4>Think of anything.</h4>
          <input type="text" placeholder="let your mind be free!" ref="seedWord" />
          <Button onClick={this.onSubmitSeedWord}>Submit</Button>
        </div>
      )
    }
  }

  render() {
    const roomID = getRoomID();
    const gameProgress = _.get(this.state, 'roomData.status.progress')
    if (roomID) {
      return (
        <div>
          <h1 style={{fontFamily: 'monospace'}}>Room code: {roomID}</h1>
          {this.state.currentPlayer ?
            <h2>Your name is: {this.state.currentPlayer}</h2> : null
          }
          <ul>
            {_.keys(this.state.roomData.players).map((playerName) => (
              <li key={playerName}>{playerName}</li>
            ))}
          </ul>
          {this.state.currentPlayer ? null :
            <div>
              <input type="text" placeholder="username" ref="joinUsername" />
              <Button onClick={this.onJoinGame}>Join Game</Button>
            </div>
          }
          {[PROGRESS.IN_PROGRESS, PROGRESS.ENDED].includes(gameProgress)?
            null :
            <Button onClick={this.onBeginGame}>Begin Game</Button>
          }
          {this.renderSeedInput()}
        </div>
      );
    }
    else {
      return (
        <div>
          <input type="text" placeholder="username" ref="newGameUsername" />
          <Button onClick={this.onStartNewGame}>Start New Game</Button>
        </div>
      );
    }
  }
}

export default App;
