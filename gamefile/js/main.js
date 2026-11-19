import { Game } from './Game.js';

/** Called by Mainmenu.js after in-game.php has been injected. Returns the running Game. */
export function launch(root) {
  const game = new Game(root, {
    devMode: root.dataset.dev === '1',
    userId: root.dataset.user,
    apiUrl: 'api.php',
    csrf: root.dataset.csrf || ''
  });
  return game.start();
}
