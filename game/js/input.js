export class InputManager {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.keys = new Set();
    this.mouseWorldX = 0;
    this.mouseWorldY = 0;
    this.isMouseDown = false;
  }

  isDown(code) {
    return this.keys.has(code);
  }

  bind() {
    window.addEventListener("keydown", (event) => {
      this.keys.add(event.code);
      this.game.onKeyDown(event);
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
      this.game.onKeyUp(event);
    });

    window.addEventListener("keypress", (event) => {
      this.game.onKeyPress(event);
    });

    this.canvas.addEventListener("mousemove", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseWorldX = event.clientX - rect.left;
      this.mouseWorldY = event.clientY - rect.top;
      this.game.onMouseMove(event);
    });

    this.canvas.addEventListener("click", (event) => {
      this.game.onClick(event);
    });

    this.canvas.addEventListener("mousedown", (event) => {
      this.isMouseDown = true;
      this.game.onMouseDown(event);
    });

    this.canvas.addEventListener("mouseup", (event) => {
      this.isMouseDown = false;
      this.game.onMouseUp(event);
    });

    this.canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.game.onContextMenu(event);
    });

    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.game.onWheel(event);
    });
  }
}
