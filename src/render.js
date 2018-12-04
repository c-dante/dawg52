import { h } from 'inferno-hyperscript';
import fp from 'lodash/fp';

import { GameState } from './dawg';

// -------- global actions...? new game...? main menu...? ------- //
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

export const HandCtrl = ({ gameState, hand, playCard }) => h('div', { class: 'hand-stats' }, [
	h('h4', {}, 'Hand'),
	h('div', {
		class: `cards ${fp.kebabCase(gameState)}`
	}, [
		...hand.map(card => h(CardRender, { card, playCard })),
		hand.length <= 0 ? h('div', {}, 'no cards in hand...') : undefined,
	]),
]);

// -------- deck ------- //

export const DeckStats = ({ deck }) => h('div', { class: 'deck-stats' }, [
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

export const GameFeedback = ({ instruction }) => h('div', { class: 'feedback'}, [
	instruction ? h('div', { class: 'instruction' }, instruction) : undefined,
]);


// -------- dawg ------- //
export const DawgRedux = ({ hand, deck, gameState, feedbackState, boundActions }) => {
	const { newGame, playCard } = boundActions;
	return h('div', { class: 'dawg' }, [
			h('h1', {}, 'dawg'),
			h(GameFeedback, feedbackState),
			h(HandCtrl, { hand, gameState, playCard, gameState }),
			h(DeckStats, { deck }),
			h(Actions, { newGame }),
		]);
};
