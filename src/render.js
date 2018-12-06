import { h } from 'inferno-hyperscript';
import fp from 'lodash/fp';

const logFn = (fn, name = '') => (...args) => {
	const out = fn(...args);
	console.log(name, args, out);
	return out;
}

import { GameState, actions } from './dawg';
import { createSelector } from 'reselect';

// -------- global actions...? new game...? main menu...? ------- //
export const actionsStateSelector = fp.get(['boundActions']);
export const Actions = ({ newGame }) => {
	return h('div', { class: 'actions' }, [
		h('button', { onClick: newGame }, ['New game']),
	]);
};

// -------- hand + cards ------- //
export const CardRender = ({ card, playCard }) => h('div', {
	class: `btn card card--${fp.kebabCase(card.type)}`,
	onClick: () => playCard(card),
}, [
	`${card.number} of ${card.type}`,
]);

export const handStateSelector = createSelector([
	fp.get(['gameState']),
	fp.get(['hand']),
	fp.get(['boundActions', 'playCard']),
], (gameState, hand, playCard) => ({ gameState, hand, playCard }));
export const Hand = ({ gameState, hand, playCard }) => h('div', { class: 'hand-stats' }, [
	h('h4', {}, 'Hand'),
	h('div', {
		class: `cards ${fp.kebabCase(gameState)}`
	}, [
		...hand.map(card => h(CardRender, { card, playCard })),
		hand.length <= 0 ? h('div', {}, 'no cards in hand...') : undefined,
	]),
]);

// -------- deck ------- //
const decktateSelector = createSelector([
	fp.get(['deck']),
], (deck) => ({ deck }));
export const Deck = ({ deck }) => h('div', { class: 'deck-stats' }, [
	h('label', {}, 'Remaining Cards: '),
	h('span', {}, deck.length),
]);

// -------- player cta ------- //
export const feedbackStateSelector = state => {
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

export const Feedback = ({ instruction }) => h('div', { class: 'feedback'}, [
	instruction ? h('div', { class: 'instruction' }, instruction) : undefined,
]);


// -------- dawg ------- //
const dawgStateSelector = createSelector([
	actionsStateSelector,
	handStateSelector,
	decktateSelector,
	feedbackStateSelector,
], (actionsState, handState, deckState, feedbackState) => ({ actionsState, handState, deckState, feedbackState }));
export const DawgRedux = (state) => {
	const dawgState = logFn(dawgStateSelector)(state);
	return h('div', { class: 'dawg' }, [
			h('h1', {}, 'dawg'),
			h(Feedback, dawgState.feedbackState),
			h(Hand, dawgState.handState),
			h(Deck, dawgState.deckState),
			h(Actions, dawgState.actionsState),
		]);
};
