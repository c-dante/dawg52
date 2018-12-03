import { render } from 'inferno';
import { h } from 'inferno-hyperscript';
import { createStore } from 'redux';
import { createSelector } from 'reselect';
import fp from 'lodash/fp';

import './index.css';

// -------- Utility Functions  ---------- //
const shuffleArray = array => {
  // fisher-yates shuffler
  // @see: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#Modern_method
	const out = array.slice();
  for (let i = 0; i < out.length; i++) {
  	const idx = Math.floor(Math.random() * (out.length - i)) + i;
    const x = out[idx];
    out[idx] = out[i];
    out[i] = x;
  }
  return out;
};

// Draws cards into a hand
const drawTo = (deck, hand, amount = 5) => {
	const toDraw = amount - hand.length;
	if (toDraw <= 0) {
		return { hand, deck };
	}

	const updatedHand = hand.concat(deck.slice(0, toDraw));
	const updatedDeck = deck.slice(toDraw);
	return {
		hand: updatedHand,
		deck: updatedDeck,
	};
};



// Helper action creator
const act = (type, payload) => ({ type, payload });

// Wrap a dispatch
const bindActBuilder = (store) => fp.mapValues(
	actionCreator => (...args) => store.dispatch(actionCreator(...args))
);


// -------- Game State Machine ---------- //
const CardType = {
	Location: 'Location',
  Event: 'Event',
  Artifact: 'Artifact',
  Person: 'Person',
};

const genDeck = () => Object.keys(CardType).flatMap(type => new Array(13).fill(0).map(
	(_,i ) => ({ type, number: i + 1 })
));


const GameAction = {
	NEW_GAME: 'GameAction:NEW_GAME',
	PLAY_CARD: 'GameAction:PLAY_CARD',
};
const actions = {
	newGame: () => act(GameAction.NEW_GAME),
	playCard: (card) => act(GameAction.PLAY_CARD, card),
}

// Transitions in comments
const GameState = {
	// -- New Game --> PlayForTurn
	PlayForTurn: 'PlayForTurn',

	// PlayForTurn -- chose a location --> PlayingLocation
	PlayingLocation: 'PlayingLocation',

	// PlayForTurn -- chose an event card --> PlayingEvent
	PlayingEvent: 'PlayingEvent', // -> Resolve

	// PlayingLocation -- chose something to find --> REsolve
	Resolve: 'Resolve', // -> PlayForTurn

	// PlayForTurn --no valid plays --> EndGame
	EndGame: 'EndGame',
};

const defaultState = {
	hand: [],
	deck: [],
	gameState: GameState.PlayForTurn,
};

const gameReducer = (state = defaultState, action) => {
	switch (action.type) {
		case GameAction.NEW_GAME: {
			// Send in a new deck + hand and draw opening
			const { deck, hand } = drawTo(shuffleArray(genDeck()), []);

			return {
				...state,
				hand,
        deck,
				gameState: GameState.PlayForTurn,
			};
		}

		case GameAction.PLAY_CARD: {
			if (state.gameState !== GameState.PlayForTurn) {
				throw new Error('Cannot play a card now.');
			}

			switch (action.payload.type) {
				case CardType.Location:
					return {
						...state,
						playingCard: action.payload,
						gameState: GameState.PlayingLocation,
					};

				case CardType.Event:
					return {
						...state,
						playingCard: action.payload,
						gameState: GameState.PlayingEvent,
					};

				default:
					throw new Error('Invalid card type');
			}
		}

		default:
			console.debug('Unhandled by dawg', state, action);
			return state;
	}
};


const store = createStore(gameReducer);
const boundActions = bindActBuilder(store)(actions);


// ------ Presentation Components ------- //
const Actions = ({ newGame }) => {
	return h('div', { class: 'actions' }, [
    h('button', { onClick: newGame }, ['New game']),
  ]);
};

const CardRender = ({ card, playCard }) => h('div', {
	class: `btn card card--${fp.kebabCase(card.type)}`,
  onClick: () => playCard(card),
}, [
	`${card.number} of ${card.type}`,
]);

const HandCtrl = ({ gameState, hand, playCard }) => h('div', { class: 'hand-stats' }, [
	h('h4', {}, 'Hand'),
  h('div', {
		class: `cards ${fp.kebabCase(gameState)}`
	}, [
    ...hand.map(card => h(CardRender, { card, playCard })),
	  hand.length <= 0 ? h('div', {}, 'no cards in hand...') : undefined,
  ]),
]);

const DeckStats = ({ deck }) => h('div', { class: 'deck-stats' }, [
  h('label', {}, 'Remaining Cards: '),
  h('span', {}, deck.length),
]);

const GameFeedback = ({ instruction }) => h('div', { class: 'feedback'}, [
	instruction ? h('div', { class: 'instruction' }, instruction) : undefined,
]);

const DawgRedux = ({ hand, deck, gameState, feedbackState }) => {
	const { newGame, playCard } = boundActions;
	return h('div', { class: 'dawg' }, [
      h('h1', {}, 'dawg'),
      h(GameFeedback, feedbackState),
      h(HandCtrl, { hand, gameState, playCard, gameState }),
      h(DeckStats, { deck }),
      h(Actions, { newGame }),
    ]);
};

const feedbackStateSelector = state => {
	switch (state.gameState) {
		case GameState.PlayForTurn:
			return {
				instruction: 'Do something. (Select a Location or Event)',
			};

		case GameState.PlayingLocation:
			return {
				instruction: 'What did you find? (Select an Artifact, Event, or Person)',
			};

		case GameState.PlayingEvent:
			return {
				instruction: `[@todo: feedback for resolve event: ${state.playingCard.number}]`,
			};

		default:
			return {
				instruction: `Start a game? [Unknown state: ${state.gameState}]`,
			};
	}
};

const gameStateSelector = fp.get(['gameState']);

const appStateSelector = createSelector([
	x => x, // adapter for now
	feedbackStateSelector,
	gameStateSelector,
], (state, feedbackState, gameState) => ({
	...state,
	feedbackState,
	gameState,
}));

const renderApp = () => {
	// @todo: hacked in -- should use connect instead
	const mergeTo = document.querySelector('body .dawg');
	const appState = appStateSelector(store.getState());
	console.log('appState', appState);
	render(h(DawgRedux, appState), document.body, mergeTo);
};

// Re-render on store updates
store.subscribe(renderApp);

// Kick off init
renderApp();
boundActions.newGame();

/*
Boilerplate notes
- binding actions is annoying
- expressing required props is annoying
- I want emmet class support in h('tag.class.class#id')
- I want better classList binding support based on state
- Weird hoops for redux... solved by preact-redux mostly (see bindings as well)
*/