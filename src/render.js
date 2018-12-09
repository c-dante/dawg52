import { h } from 'inferno-hyperscript';
import fp from 'lodash/fp';
import { createSelector } from 'reselect';
import classNames from 'classnames';

const logFn = (fn, name = '') => (...args) => {
	const out = fn(...args);
	console.log(name, args, out);
	return out;
}

import { GameState, validPlaysForState } from './dawg';









// -------- global actions...? new game...? main menu...? ------- //
export const actionsStateSelector = fp.get(['boundActions']);
export const Actions = ({ newGame }) => {
	return h('section', { class: 'actions' }, [
		h('button', { onClick: newGame }, ['New game']),
	]);
};


// -------- A single card ------- //
const CardRender = ({ card, playCard = fp.noop, validPlays = new Set() }) => h('div', {
	class: classNames('btn', 'card', {
		'valid-play': validPlays.has(card.type),
	}),
	onClick: () => playCard(card),
}, [
	card.name,
]);





// -------- Resolve ------- //
const resolveStateSelector = createSelector([
	fp.get('resolution'),
	fp.get('boundActions'),
], (resolution, boundActions) => {
	if (!resolution) {
		return undefined;
	}

	return { resolution, onNext: boundActions.continue };
});
const Resolve = ({ resolution, onNext }) => h('div', { class: classNames('resolve', {
	'resolve--success': resolution.success,
	'resolve--failure': !resolution.success,
}) }, [
	h('div', {}, resolution.message),
	h('button', { onClick: onNext }, 'Next'),
]);






// -------- InPlay ------- //
const inPlayStateSelector = createSelector([
	fp.get('played'),
	fp.get('currentLocation'),
], (cards, currentLocation) => ({
	cards,
	locationName: currentLocation ? `At: ${currentLocation.name}` : 'Lost in the wilderness',
}));
const InPlay = ({ cards, locationName }) => h('section', { class: 'in-play' }, [
	h('h4', {}, locationName),
	h('div', { class: classNames('cards', { 'cards--empty': cards.length <= 0 }) }, [
		cards.length <= 0 ? 'You have nothing.' : undefined,
		...cards.map(card => h(CardRender, { card })),
	]),
]);











// -------- Discard ------- //
const discardStateSelector = createSelector(
	[fp.get('discard')], (cards) => ({ cards })
);
const Discard = ({ cards }) => h('section', { class: 'dicard' }, [
	h('h4', {}, 'Dicard'),
	cards.length <= 0
		? h('div', {}, 'Empty.')
		: h('div', { }, [
				h('div', {}, cards.length),
				// h('button', {}, 'View'),
			]),
]);






// -------- hand + cards ------- //
const validPlaysSelector = createSelector(
	[fp.get(['gameState'])],
	(gameState) => fp.getOr(new Set(), [gameState], validPlaysForState)
);
export const handStateSelector = createSelector([
	fp.get(['hand']),
	fp.get(['boundActions', 'playCard']),
	validPlaysSelector,
], (hand, playCard, validPlays) => ({ hand, playCard, validPlays }));
export const Hand = ({ hand, playCard, validPlays }) => h('section', { class: 'hand-stats' }, [
	h('h4', {}, 'Hand'),
	h('div', {
		class: 'cards'
	}, [
		...hand.map(card => h(CardRender, { card, playCard, validPlays })),
		hand.length <= 0 ? h('div', {}, 'no cards in hand...') : undefined,
	]),
]);





// -------- deck ------- //
const decktateSelector = createSelector(
	[fp.get(['deck'])], (deck) => ({ deck })
);
export const Deck = ({ deck }) => h('section', { class: 'deck-stats' }, [
	h('label', {}, 'Remaining Cards: '),
	h('span', {}, deck.length),
]);







// -------- player cta ------- //
const gameOverSelector = createSelector([
	fp.get(['gameState']),
	fp.get(['hand']),
	validPlaysSelector,
], (gameState, hand, validPlays) => {
	if (gameState !== GameState.PlayForTurn) {
		return false;
	}

	const possiblePlays = hand.filter(card => validPlays.has(card.type));
	return possiblePlays.length <= 0;
});
export const instructionSelector = createSelector([
	fp.get(['gameState']),
	fp.get(['playingCard', 'name']),
	gameOverSelector,
], (gameState, playingCardName, gameOver) =>{
		switch (gameState) {
			case GameState.PlayForTurn:
				return gameOver
					? 'No more plays. Game over.'
					: 'Do something. (Select a Location or Event)';

			case GameState.PlayingLocation:
				return `On your way to ${playingCardName}, you stumble across... (Select an Artifact, Event, or Person)`;

			case GameState.Resolve:
				return '';

			default:
				return `Start a game? [Unknown state: ${gameState}]`;
		}
	}
);

const skipStepSelector = createSelector([
	fp.get('gameState'),
	fp.get('boundActions'),
], (gameState, boundActions) => {
	if (gameState === GameState.PlayingLocation) {
		return {
			hasSkip: true,
			onSkip: () => boundActions.playCard(undefined), // no play
		};
	}

	return {
		hasSkip: false,
	};
});
const feedbackStateSelector = createSelector([
	instructionSelector,
	skipStepSelector,
	resolveStateSelector,
	gameOverSelector,
], (instruction, skipStep, resolveState, gameOver) => ({ instruction, skipStep, resolveState, gameOver }))
export const Feedback = ({ instruction, skipStep, resolveState, gameOver }) => h('section', { class: 'feedback'}, [
	resolveState ? h(Resolve, resolveState) : undefined,
	instruction ? h('div', { class: 'instruction' }, instruction) : undefined,
	skipStep.hasSkip ? h('button', { onClick: skipStep.onSkip }, 'Skip') : undefined,
	gameOver ? h('button', { onClick: fp.noop }, 'Score This Game') : undefined,
]);






// -------- game log do show your history ------- //
const gameLogStateSelector = createSelector(
	[fp.get(['gameLog'])],
	(events) => ({
		events: events.slice().reverse(),
	})
);
const GameLog = ({ events }) => h('section', { class: 'game-log'}, [
	...events.map((event, i) => h('div', { class: 'log-message' }, `[${new Date(event.postedAt).toISOString()}] ${event.message}`)),
]);







// -------- dawg ------- //
const dawgStateSelector = createSelector([
	actionsStateSelector,
	handStateSelector,
	decktateSelector,
	feedbackStateSelector,
	discardStateSelector,
	inPlayStateSelector,
	gameLogStateSelector,
], (actionsState, handState, deckState, feedbackState, discardState, inPlayState, gameLogState) => ({
	actionsState, handState, deckState, feedbackState, discardState, inPlayState, gameLogState,
}));
export const DawgRedux = (state) => {
	const dawgState = logFn(dawgStateSelector)(state);
	return h('div', { class: 'dawg' }, [
			h('h1', {}, ['dawg', h('div', { class: 'small' }, state.gameState)]),
			h(InPlay, dawgState.inPlayState),
			h(Feedback, dawgState.feedbackState),
			h(Hand, dawgState.handState),
			h(Deck, dawgState.deckState),
			h(Discard, dawgState.discardState),
			h(Actions, dawgState.actionsState),
			h(GameLog, dawgState.gameLogState),
		]);
};
