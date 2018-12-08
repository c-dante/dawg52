import { act, drawTo, shuffleArray } from './util';

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
	})
));

/**
 * Our possible states
 */
export const GameState = {
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

/**
 * Empty default representation
 */
const defaultState = {
	hand: [],
	deck: [],
	discard: [],
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

		case CardType.Event:
			return {
				...state,
				playingCard: card,
				gameState: GameState.PlayingEvent,
			};

		default:
			throw new Error('Invalid card type');
	}
};

// Play a new location
const playLocation = (state, action) => {
	const tryFind = action.payload;
	if (!tryFind) {
		return {
			...state,
			hand: hand.filter(x => x !== card),
			discard: state.discard.concat(card),
			gameState: GameState.Resolve,
			resolution: {
				message: `Welcome to ${location.type}`,
				success: true,
			},
		};
	}

	throw new Error('@todo: handle location play.');
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
};
export const actions = {
	newGame: () => act(GameAction.NEW_GAME),
	playCard: (card) => act(GameAction.PLAY_CARD, card),
};
export const reducer = (state = defaultState, action) => {
	switch (action.type) {
		case GameAction.NEW_GAME: {
			// Send in a new deck + hand and draw opening
			const { deck, hand } = drawTo(shuffleArray(genDeck()), []);

			return {
				...state,
				hand,
				deck,
				discard: [],
				gameState: GameState.PlayForTurn,
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

		default:
			console.debug('Unhandled by dawg', state, action);
			return state;
	}
};
