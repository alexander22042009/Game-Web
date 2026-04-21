import { AudioManager } from "./audio.js";
import { Game } from "./game.js";
import { InputManager } from "./input.js";
import { Renderer } from "./renderer.js";
import { UIManager } from "./ui.js";

window.addEventListener("load", () => {
  const canvas = document.getElementById("game-canvas");
  const renderer = new Renderer(canvas);
  const audio = new AudioManager();

  let game = null;
  const input = new InputManager(canvas, {
    onKeyDown: (...args) => game?.onKeyDown(...args),
    onKeyUp: (...args) => game?.onKeyUp(...args),
    onKeyPress: (...args) => game?.onKeyPress(...args),
    onMouseMove: (...args) => game?.onMouseMove(...args),
    onClick: (...args) => game?.onClick(...args),
    onMouseDown: (...args) => game?.onMouseDown(...args),
    onMouseUp: (...args) => game?.onMouseUp(...args),
    onContextMenu: (...args) => game?.onContextMenu(...args),
    onWheel: (...args) => game?.onWheel(...args),
  });
  const ui = new UIManager(
    {
      startGame: () => game?.startGame(),
      restartGame: () => game?.restartGame(),
      togglePause: (v) => game?.togglePause(v),
    },
    audio
  );

  game = new Game({ canvas, renderer, input, ui, audio });
  input.game = game;
  ui.game = game;

  input.bind();
  ui.bind();
  game.init();
});
