import fp from 'lodash/fp';

/**
 * fisher-yates shuffler
 * @see: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#Modern_method
 */
export const shuffleArray = array => {
	const out = array.slice();
  for (let i = 0; i < out.length; i++) {
  	const idx = Math.floor(Math.random() * (out.length - i)) + i;
    const x = out[idx];
    out[idx] = out[i];
    out[i] = x;
  }
  return out;
};

/**
 * Draws cards into a hand
 */
export const drawTo = (deck, hand, amount = 5) => {
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


// ------ State/redux utils -------
/**
 * Helper action creator
 */
export const act = (type, payload) => ({ type, payload });

/**
 * Wrap a dispatch
 */
export const bindActBuilder = (store) => fp.mapValues(
	actionCreator => (...args) => store.dispatch(actionCreator(...args))
);
