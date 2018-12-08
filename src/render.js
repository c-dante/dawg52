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
	return h('div', { class: 'actions' }, [
		h('button', { onClick: newGame }, ['New game']),
	]);
};







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









// -------- Discard ------- //
const discardStateSelector = createSelector(
	[fp.get('discard')], (cards) => ({ cards })
);
const Discard = ({ cards }) => h('div', { class: 'dicard' }, [
	h('h4', {}, 'Dicard'),
	cards.length <= 0
		? h('div', {}, 'Empty.')
		: h('div', { }, [
				h('div', {}, cards.length),
				// h('button', {}, 'View'),
			]),
]);






// -------- hand + cards ------- //
export const CardRender = ({ card, playCard, validPlays }) => h('div', {
	class: classNames('btn', 'card', {
		'valid-play': validPlays.has(card.type),
	}),
	onClick: () => playCard(card),
}, [
	card.name,
]);

const validPlaysSelector = createSelector(
	[fp.get(['gameState'])],
	(gameState) => fp.getOr(new Set(), [gameState], validPlaysForState)
);
export const handStateSelector = createSelector([
	fp.get(['hand']),
	fp.get(['boundActions', 'playCard']),
	validPlaysSelector,
], (hand, playCard, validPlays) => ({ hand, playCard, validPlays }));
export const Hand = ({ hand, playCard, validPlays }) => h('div', { class: 'hand-stats' }, [
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
export const Deck = ({ deck }) => h('div', { class: 'deck-stats' }, [
	h('label', {}, 'Remaining Cards: '),
	h('span', {}, deck.length),
]);







// -------- player cta ------- //
export const instructionSelector = createSelector([
	fp.get(['gameState']),
	fp.get(['playingCard', 'name']),
], (gameState, playingCardName) =>{
		switch (gameState) {
			case GameState.PlayForTurn:
				return 'Do something. (Select a Location or Event)'

			case GameState.PlayingLocation:
				return `On your way to ${playingCardName}, you stumble across... (Select an Artifact, Event, or Person)`;

			case GameState.PlayingEvent:
				return `[@todo: feedback for resolve event: ${playingCardName}]`;

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
], (instruction, skipStep, resolveState) => ({ instruction, skipStep, resolveState }))
export const Feedback = ({ instruction, skipStep, resolveState }) => h('div', { class: 'feedback'}, [
	resolveState ? h(Resolve, resolveState) : undefined,
	instruction ? h('div', { class: 'instruction' }, instruction) : undefined,
	skipStep.hasSkip ? h('button', { onClick: skipStep.onSkip }, 'Skip') : undefined,
]);








// -------- dawg ------- //
const dawgStateSelector = createSelector([
	actionsStateSelector,
	handStateSelector,
	decktateSelector,
	feedbackStateSelector,
	discardStateSelector,
], (actionsState, handState, deckState, feedbackState, discardState) => ({
	actionsState, handState, deckState, feedbackState, discardState,
}));
export const DawgRedux = (state) => {
	const dawgState = logFn(dawgStateSelector)(state);
	return h('div', { class: 'dawg' }, [
			h('h1', {}, ['dawg', h('div', { class: 'small' }, state.gameState)]),
			h(Feedback, dawgState.feedbackState),
			h(Hand, dawgState.handState),
			h(Deck, dawgState.deckState),
			h(Discard, dawgState.discardState),
			h(Actions, dawgState.actionsState),
		]);
};
