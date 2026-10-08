import { Input } from './core/Input.js';
import { Game } from './core/Game.js';
import { Ui } from './ui/Ui.js';

const canvas = document.querySelector('#game');
const ui = new Ui();
const input = new Input(canvas);
const game = new Game({ canvas, input, ui });
ui.onUpgrade = (id) => game.chooseUpgrade(id);

ui.hideBootNote();

document.querySelector('#start-screen').addEventListener('click', () => {
  game.start();
});

document.querySelector('#resume-button').addEventListener('click', () => {
  game.togglePause();
});

document.querySelector('#restart-button').addEventListener('click', () => {
  game.restart();
});

document.querySelector('#result-restart').addEventListener('click', () => {
  game.restart();
});

document.querySelector('#result-menu').addEventListener('click', () => {
  game.backToMenu();
});

window.addEventListener('keydown', (event) => {
  if (event.repeat) {
    return;
  }
  if (event.code === 'Escape') {
    game.togglePause();
    return;
  }
  if ((event.code === 'Enter' || event.code === 'Space') && game.state === 'menu') {
    event.preventDefault();
    game.start();
    return;
  }
  if (event.code === 'KeyR' && (game.state === 'paused' || game.state === 'result')) {
    game.restart();
  }
});

game.startLoop();
