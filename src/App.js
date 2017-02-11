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
    const seedWord = this.refs.seedWord.value
    const roundKey = _.get(this.state, 'roomData.status.currentRound')
    firebase.submitSeedWord(seedWord, roundKey)
  }

  renderSeedInput = () => {
    const roundKey = _.get(this.state, 'roomData.status.currentRound')
    const gameProgress = _.get(this.state, 'roomData.status.progress')
    const seedPlayer = _.get(this.state, 'roomData.rounds.' + roundKey + '.seed.player')
    if (
      gameProgress === PROGRESS.WAITING_FOR_SEED &&
      seedPlayer && seedPlayer === this.state.currentPlayer
    ) {
      return (
        <div>
          <h4>Think of anything.</h4>
          <input type="text" placeholder="let your mind be free!" ref="seedWord" />
          <Button onClick={this.onSubmitSeedWord}>Submit</Button>
        </div>
      )
    }
  }

  onSubmitConnectionWord = async () => {
    const connectionWord = this.refs.connectionWord.value
    const roundKey = _.get(this.state, 'roomData.status.currentRound')
    await firebase.submitConnectionWord(connectionWord, roundKey, this.state.currentPlayer)
  }

  renderWordConnection = () => {
    const roundKey = _.get(this.state, 'roomData.status.currentRound')
    const gameProgress = _.get(this.state, 'roomData.status.progress')
    const seedPlayer = _.get(this.state, 'roomData.rounds.' + roundKey + '.seed.player')
    const seedWord = _.get(this.state, 'roomData.rounds.' + roundKey + '.seed.word')
    if (
      gameProgress === PROGRESS.WAITING_FOR_CONNECTIONS &&
      seedPlayer && seedPlayer !== this.state.currentPlayer
    ) {
      return (
        <div>
          <h3>{seedPlayer} submitted the word: {seedWord}</h3>
          <p>What comes to mind?</p>
          <input type="text" placeholder={'Channel your inner ' + seedPlayer + '!'} ref="connectionWord" />
          <Button onClick={this.onSubmitConnectionWord}>Submit</Button>
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
          {gameProgress === PROGRESS.WAITING_TO_BEGIN ?
            <Button onClick={this.onBeginGame}>Begin Game</Button> :
            null
          }
          {this.renderSeedInput()}
          {this.renderWordConnection()}
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
