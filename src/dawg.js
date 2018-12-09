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
			const eventMessage = `Off in the distance, you see something strange. It's ${card.name}!`;
			return {
				...state,
				hand: state.hand.filter(x => x !== card),
				played: state.played.concat(card),
				gameState: GameState.Resolve,
				resolution: {
					message: eventMessage,
					success: true,
				},
				gameLog: state.gameLog.concat(
					gameMessage(eventMessage),
				),
			};
		};

		default:
			throw new Error('Invalid card type');
	}
};

// Play a new location
const playLocation = (state, action) => {
	const visiting = state.playingCard;
	const tryFind = action.payload;

	const locationMessage = `Welcome to ${visiting.name}`;
	if (!tryFind) {
		return {
			...state,
			hand: state.hand.filter(x => x !== visiting),
			played: state.played.concat(visiting),
			currentLocation: visiting,
			gameState: GameState.Resolve,
			resolution: {
				locationMessage,
				success: true,
			},
			gameLog: state.gameLog.concat(gameMessage(locationMessage))
		};
	}

	switch (tryFind.type) {
		case CardType.Artifact: {
			const artifactMessage = `You found ${tryFind.name} on your way!`;
			return {
				...state,
				hand: state.hand.filter(x => x !== visiting && x !== tryFind),
				played: state.played.concat(visiting, tryFind),
				currentLocation: visiting,
				gameState: GameState.Resolve,
				resolution: {
					message: [locationMessage, artifactMessage].join(' '),
					success: true,
				},
				gameLog: state.gameLog.concat(
					gameMessage(locationMessage),
					gameMessage(artifactMessage),
				),
			};
		};

		case CardType.Event: {
			const eventMessage = `While heading to ${visiting.name}, ${tryFind.name} jumps out.`;
			return {
				...state,
				hand: state.hand.filter(x => x !== visiting && x !== tryFind),
				played: state.played.concat(visiting, tryFind),
				currentLocation: visiting,
				gameState: GameState.Resolve,
				resolution: {
					message: [locationMessage, eventMessage].join(' '),
					success: true,
				},
				gameLog: state.gameLog.concat(
					gameMessage(locationMessage),
					gameMessage(eventMessage),
				),
			};
		}

		case CardType.Person: {
			const eventMessage = `"Hey!" A stranger beckons. It's ${tryFind.name}!`;
			return {
				...state,
				hand: state.hand.filter(x => x !== visiting && x !== tryFind),
				played: state.played.concat(visiting, tryFind),
				currentLocation: visiting,
				gameState: GameState.Resolve,
				resolution: {
					message: [locationMessage, eventMessage].join(' '),
					success: true,
				},
				gameLog: state.gameLog.concat(
					gameMessage(locationMessage),
					gameMessage(eventMessage),
				),
			};
		}

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
