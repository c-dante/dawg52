import { render } from 'inferno';
import { h } from 'inferno-hyperscript';
import { createStore } from 'redux';

import './index.css';

import  { bindActBuilder } from './util';


// Build our store
import { reducer as gameReducer, actions } from './dawg';
const store = createStore(
	gameReducer,
	// dev tools browser extension @see: http://extension.remotedev.io/#usage
	window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

// Wrap to auto-dispatch out actions
const boundActions = bindActBuilder(store)(actions);

// Build our rendering
import { DawgRedux } from './render';

const renderApp = () => {
	// @todo: hacked in -- should use connect instead
	const mergeTo = document.querySelector('body .dawg');
	const appStateWithActiions = {
		...store.getState(),
		boundActions, // ? spread?
	};
	render(h(DawgRedux, appStateWithActiions), document.body, mergeTo);
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
