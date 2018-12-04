import { act, drawTo, shuffleArray } from './util';

export const CardType = {
	Location: 'Location',
  Event: 'Event',
  Artifact: 'Artifact',
  Person: 'Person',
};

export const genDeck = () => Object.keys(CardType).flatMap(type => new Array(13).fill(0).map(
	(_,i ) => ({ type, number: i + 1 })
));


export const GameAction = {
	NEW_GAME: 'GameAction:NEW_GAME',
	PLAY_CARD: 'GameAction:PLAY_CARD',
};

export const actions = {
	newGame: () => act(GameAction.NEW_GAME),
	playCard: (card) => act(GameAction.PLAY_CARD, card),
}

// Transitions in comments
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

const defaultState = {
	hand: [],
	deck: [],
	gameState: GameState.PlayForTurn,
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
