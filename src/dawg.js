import fp from 'lodash/fp';
import { act, drawTo, shuffleArray } from './util';

// @todo: users love messages!
const gameMessage = (message) => ({
	 message,
	 postedAt: Date.now()
});

// Let's build a deck!
export const CardType = {
	Location: 'Location',
  Event: 'Event',
  Artifact: 'Artifact',
  Person: 'Person',
};

export const genDeck = () => Object.keys(CardType).flatMap(type => new Array(13).fill(0).map(
	(_,i ) => ({
		type,
		number: i + 1,
		name: `${i + 1} of ${type}`,
		faceDown: true,
		upsideDown: false,
	})
));

/**
 * Our possible states
 */
export const GameState = {
	// -- New Game --> PlayForTurn
	// Resolve -- press next --> PlayForTurn
	PlayForTurn: 'PlayForTurn',

	// PlayForTurn -- chose a location --> PlayingLocation
	PlayingLocation: 'PlayingLocation',

	// PlayForTurn -- chose an event card --> Resolve
	// PlayingLocation -- chose something to find --> REsolve
	Resolve: 'Resolve', // --> PlayForTurn

	// PlayForTurn --no valid plays --> EndGame
	EndGame: 'EndGame',
};

/**
 * Empty default representation
 */
const defaultState = {
	hand: [],
	deck: [],
	played: [],
	discard: [],
	gameLog: [],
	currentLocation: undefined,
	gameState: GameState.PlayForTurn,
	resolution: undefined,
};


// States where playCard is valid
export const canPlayCards = new Set([
	GameState.PlayForTurn,
	GameState.PlayingLocation,
]);

// Given a state, what are valid plays
export const validPlaysForState = {
	// PlayForTurn -- Locations | Event --> ...
	[GameState.PlayForTurn]: new Set([
		CardType.Location,
		CardType.Event,
	]),

	// PlayingLocation -- Event | Artifact | Person
	[GameState.PlayingLocation]: new Set([
		CardType.Event,
		CardType.Artifact,
		CardType.Person,
	]),
};


// -------------- Resolution Logic ---------------- //

const resolveLocation = (state, location) => {
	const message = `Welcome to ${location.name}.`;
	return {
		...state,
		// Set the location
		currentLocation: location,

		// Update hand / play
		hand: state.hand.filter(x => x !== location),
		played: state.played.concat(location),

		// Set the resolution screen
		gameState: GameState.Resolve,
		resolution: {
			message,
			success: true,
		},
		gameLog: state.gameLog.concat(gameMessage(message))
	};
};





const resolveEvent = (state, event) => {
	const currentLocation = state.currentLocation;
	const locationText = currentLocation ? `on your way to ${currentLocation.name}` : 'wandering the wilderness';
	const message = `While ${locationText}, ${event.name} jumps out.`;
	return {
		...state,

		// Update hand / play
		hand: state.hand.filter(x => x !== event),
		played: state.played.concat(event),

		// Set the resolution screen @todo: merge?
		gameState: GameState.Resolve,
		resolution: {
			message: [message, fp.get(['resolution', 'message'], state)].filter(x => x).join('\n'),
			success: true,
		},
		gameLog: state.gameLog.concat(gameMessage(message)),
	};
};




const resolveArtifact = (state, artifact) => {
	const currentLocation = state.currentLocation;
	const locationText = currentLocation ? `on your way to ${currentLocation.name}` : 'wandering the wilderness';
	const message = `While ${locationText}, you stumble on ${artifact.name}.`;
	return {
		...state,

		// Update hand / play
		hand: state.hand.filter(x => x !== artifact),
		played: state.played.concat(artifact),

		// Set the resolution screen @todo: merge?
		gameState: GameState.Resolve,
		resolution: {
			message: [message, fp.get(['resolution', 'message'], state)].filter(x => x).join(' '),
			success: true,
		},
		gameLog: state.gameLog.concat(gameMessage(message)),
	};
};



const resolvePerson = (state, person) => {
	const currentLocation = state.currentLocation;
	const locationText = currentLocation ? `on your way to ${currentLocation.name}` : 'wandering the wilderness';
	const message = `While ${locationText}, a stranger beckons. It's ${person.name}!`;
	return {
		...state,

		// Update hand / play
		hand: state.hand.filter(x => x !== person),
		played: state.played.concat(person),

		// Set the resolution screen @todo: merge?
		gameState: GameState.Resolve,
		resolution: {
			message: [message, fp.get(['resolution', 'message'], state)].filter(x => x).join(' '),
			success: true,
		},
		gameLog: state.gameLog.concat(gameMessage(message)),
	};
};











// Handler for playing a card in a given state
const playForTurn = (state, action) => {
	const card = action.payload;
	switch (card.type) {
		case CardType.Location:
			return {
				...state,
				playingCard: card,
				gameState: GameState.PlayingLocation,
			};

		case CardType.Event: {
			return resolveEvent(state, card);
		};

		default:
			throw new Error('Invalid card type');
	}
};

// Play a new location
const playLocation = (state, action) => {
	const visiting = state.playingCard;
	const tryFind = action.payload;

	// First just resolve going to the location
	const stateAfterVisit = resolveLocation(state, visiting);

	// Not finding anything, then we just visit the location
	if (!tryFind) {
		return stateAfterVisit;
	}

	// Otherwise, let's attempt to find something along the way!
	switch (tryFind.type) {
		case CardType.Artifact:
			return resolveArtifact(stateAfterVisit, tryFind);

		case CardType.Event:
			return resolveEvent(stateAfterVisit, tryFind);

		case CardType.Person:
			return resolvePerson(stateAfterVisit, tryFind);

		default:
			throw new Error(`@todo: handle finding ${tryFind.name} at location`);
	}
};

// Map the state to the handler for playing a card
const stateToPlayHandler = {
	[GameState.PlayForTurn]: playForTurn,
	[GameState.PlayingLocation]: playLocation,
};







// Our state machine
export const GameAction = {
	NEW_GAME: 'GameAction:NEW_GAME',
	PLAY_CARD: 'GameAction:PLAY_CARD',
	CONTINUE: 'GameAction:CONTINUE',
};
export const actions = {
	newGame: () => act(GameAction.NEW_GAME),
	playCard: (card) => act(GameAction.PLAY_CARD, card),
	continue: () => act(GameAction.CONTINUE),
};
export const reducer = (state = defaultState, action) => {
	switch (action.type) {
		case GameAction.NEW_GAME: {
			// Send in a new deck + hand and draw opening
			const { deck, hand } = drawTo(shuffleArray(genDeck()), []);

			return {
				...defaultState,
				hand,
				deck,
				gameState: GameState.PlayForTurn,
				gameLog: state.gameLog.concat(gameMessage('[New Game]')),
			};
		}

		// Look up a play hander based on current state + resolve state change
		case GameAction.PLAY_CARD: {
			// Make sure we can play a card
			if (!canPlayCards.has(state.gameState)) {
				throw new Error('Cannot play a card now.');
			}

			const validSet = validPlaysForState[state.gameState];
			if (!validSet) {
				throw new Error(`No valid plays in ${state.gameState}?`);
			}

			// Let the current state handle the card being played
			const handler = stateToPlayHandler[state.gameState];
			if (!handler) {
				throw new Error(`No handler for ${state.gameState}`);
			}
			return handler(state, action);
		}

		// We read some feedback, so advance from resolve state
		case GameAction.CONTINUE:
			// Draw up to 5
			const { deck, hand } = drawTo(state.deck, state.hand);
			return {
				...state,
				deck,
				hand,
				gameState: GameState.PlayForTurn,
				resolution: undefined,
			};

		default:
			console.debug('Unhandled by dawg', state, action);
			return state;
	}
};
