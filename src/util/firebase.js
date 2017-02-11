import firebase from 'firebase';
import _ from 'lodash';
import getRoomID from './getRoomID';
import {ROLES, PROGRESS} from './constants';

const config = {
  apiKey: "AIzaSyDrkXOwfrRJ_K6UyAOzfGyVnbgAVwP9RPE",
  authDomain: "thinkfast-41d88.firebaseapp.com",
  databaseURL: "https://thinkfast-41d88.firebaseio.com",
  storageBucket: "thinkfast-41d88.appspot.com",
  messagingSenderId: "251919933131"
};
firebase.initializeApp(config);

function create4CharacterID() {
  return _.random(46656, 1679615).toString(36).toUpperCase()
}

function fbref(/* args */) {
  return firebase.database().ref(_.toArray(arguments).join('/'))
}

/**
 * @param  {String} username
 * @return {Promise} -- resolves to new room ID
 */
export async function startNewGame(username) {
  const newRoomID = create4CharacterID();
  await fbref('rooms', newRoomID).set({
    roomID: newRoomID,
    players: {
      [username]: {
        username: username,
        role: ROLES.CREATOR,
        createdAt: new Date().valueOf()
      }
    },
    status: {
      progress: PROGRESS.WAITING_TO_BEGIN
    }
  })
  return newRoomID

}

export function joinGame(username) {
  const roomID = getRoomID()
  return fbref('rooms', roomID, 'players', username).set({
    username: username,
    role: ROLES.PARTICIPANT,
    createdAt: new Date().valueOf()
  })
}

export async function beginGame() {
  const roomID = getRoomID()

  const playersSnapshot = await fbref('rooms', roomID, 'players').once('value')
  const players = playersSnapshot.val()
  const initialPlayerState = _.chain(players)
    .keys()
    .reduce((obj, username) => {
      obj[username] = {
        score: 0,
        seedSubmissions: 0
      }
      return obj
    }, {})
    .value()
  await fbref('rooms', roomID, 'playerState').set(initialPlayerState)
  const newRound = await fbref('rooms', roomID, 'rounds').push({
    createdAt: new Date().valueOf()
  })
  const firstSeedPlayer = _.sample(_.keys(players))
  const newRoundKey = newRound.key

  await fbref('rooms', roomID, 'rounds', newRoundKey, 'seed').set({
    player: firstSeedPlayer,
    createdAt: new Date().valueOf()
  })

  await fbref('rooms', roomID, 'status').set({
    progress: PROGRESS.WAITING_FOR_SEED,
    currentRound: newRoundKey
  })



  // {
  //   4J2L: {
  //     players: {},
  //     roomID: '4J2L',
  //     status: {
  //       progress: GAME_ENDED || WAITING_FOR_NEXT_ROUND || WAITING_TO_BEGIN || WAITING_FOR_CONNECTIONS || WAITING_FOR_SEED,
  //       currentRound: a35gs09332erw
  //     },
  //     playerState: {
  //       elfrey: {
  //         score: 34,
  //         seedSubmissions: 2
  //       },
  //       rosanna: {
  //         score: 19,
  //         seedSubmissions: 0
  //       }
  //     },
  //     rounds: { // array
  //       001: {
  //         roundID: '001',
  //         createdAt: 2395083290,
  //         seed: {
  //           player: 'elfrey',
  //           word: 'poop',
  //           createdAt: 23857324
  //         },
  //         connections: { // array
  //           001: {
  //             player: 'rosanna',
  //             word: 'butt',
  //             createdAt: 5832583724
  //           },
  //           002: {
  //             player: 'james',
  //             word: 'buttocks',
  //             createdAt: 235823089
  //           }
  //         }
  //       },
  //       002: {}
  //     }
  //   }
  // }

}

export async function submitSeedWord(seedWord, roundKey) {
  const roomID = getRoomID()
  await fbref('rooms', roomID, 'rounds', roundKey, 'seed/word').set(seedWord)
  return await fbref('rooms', roomID, 'status/progress').set(PROGRESS.WAITING_FOR_CONNECTIONS)
}

export async function submitConnectionWord(connectionWord, roundKey, currentPlayer) {
  const roomID = getRoomID()
  await fbref('rooms', roomID, 'rounds', roundKey, 'connections').push({
    player: currentPlayer,
    word: connectionWord,
    createdAt: new Date().valueOf()
  })
}

export function onUpdate(roomID, callback) {
  fbref('rooms', roomID).on('value', (snapshot) => {
    callback(snapshot.val());
  })
}

export default {
  startNewGame,
  joinGame,
  beginGame,
  submitSeedWord,
  submitConnectionWord,
  onUpdate
}
