# [dawg 52](https://c-dante.github.io/dawg52/)
a web-based impl of [Just the stats, Ma’am](https://hackmd.io/s/ryiNjY5Ym).


### Design
dawg.js defines the game

render.js maps the results of dawg to ui

#### dawg.js
This is the main game logic. Defines:
* A deck (CardType/genDeck)
* The game's state machine (GameState)
* The data side of the game state (defaultState)
* Logic to resolve card plays (resolveLocation, etc)
* The redux-style reducer for the dawg app state machine


#### render.js
This is the ui logic. It contains components and state selectors to give the dawg.js