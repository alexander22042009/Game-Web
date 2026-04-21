import { GAME_STATE } from "./constants.js";

export class UIManager {
  constructor(game, audio) {
    this.game = game;
    this.audio = audio;
    this.el = {
      hud: document.getElementById("hud"),
      hudHealth: document.getElementById("hud-health"),
      hudScore: document.getElementById("hud-score"),
      hudLevel: document.getElementById("hud-level"),
      hudShards: document.getElementById("hud-shards"),
      hudMuteBtn: document.getElementById("hud-mute-btn"),
      hudWeapon: document.getElementById("hud-weapon"),
      menu: document.getElementById("menu-screen"),
      pause: document.getElementById("pause-screen"),
      gameOver: document.getElementById("game-over-screen"),
      playBtn: document.getElementById("play-btn"),
      resumeBtn: document.getElementById("resume-btn"),
      pauseRestartBtn: document.getElementById("pause-restart-btn"),
      pauseMuteBtn: document.getElementById("pause-mute-btn"),
      restartBtn: document.getElementById("restart-btn"),
      finalTitle: document.getElementById("final-title"),
      finalScore: document.getElementById("final-score"),
      finalLevel: document.getElementById("final-level"),
      helpTip: document.getElementById("help-tip"),
    };
  }

  bind() {
    this.el.playBtn.addEventListener("click", () => {
      this.audio.playUiClick();
      this.game.startGame();
    });
    this.el.resumeBtn.addEventListener("click", () => {
      this.audio.playUiClick();
      this.game.togglePause(false);
    });
    this.el.pauseRestartBtn.addEventListener("click", () => {
      this.audio.playUiClick();
      this.game.restartGame();
    });
    this.el.restartBtn.addEventListener("click", () => {
      this.audio.playUiClick();
      this.game.restartGame();
    });

    const muteHandler = () => {
      this.audio.playUiClick();
      const muted = this.audio.toggleMute();
      this.updateMuteLabel(muted);
    };
    this.el.hudMuteBtn.addEventListener("click", muteHandler);
    this.el.pauseMuteBtn.addEventListener("click", muteHandler);
  }

  update(game) {
    this.el.hudHealth.textContent = `HP: ${Math.max(0, Math.round(game.player.health))}`;
    this.el.hudScore.textContent = `Score: ${Math.floor(game.score)}`;
    this.el.hudLevel.textContent = `Level: ${game.levelNumber}`;
    this.el.hudShards.textContent = `Shards: ${game.level.shardsCollected}/${game.level.shardTarget}`;
    this.el.hudWeapon.textContent = `Mode: ${game.player.weaponMode}`;
    this.updateScreens(game.state);
  }

  updateScreens(state) {
    this.el.hud.classList.toggle("hidden", state !== GAME_STATE.PLAYING && state !== GAME_STATE.PAUSED);
    this.setOverlay(this.el.menu, state === GAME_STATE.MENU);
    this.setOverlay(this.el.pause, state === GAME_STATE.PAUSED);
    this.setOverlay(this.el.gameOver, state === GAME_STATE.GAME_OVER);
  }

  setOverlay(node, visible) {
    node.classList.toggle("visible", visible);
    node.classList.toggle("hidden", !visible);
  }

  updateMuteLabel(muted) {
    const value = muted ? "On" : "Off";
    this.el.hudMuteBtn.textContent = `Mute: ${value}`;
    this.el.pauseMuteBtn.textContent = `Mute: ${value}`;
  }

  showGameOver(score, level, won = false) {
    this.el.finalTitle.textContent = won ? "Simulation Cleared" : "Simulation Failed";
    this.el.finalScore.textContent = `Score: ${Math.floor(score)}`;
    this.el.finalLevel.textContent = won ? `Completed Level: ${level}` : `Highest Level: ${level}`;
  }

  toggleHelp() {
    this.el.helpTip.classList.toggle("hidden");
  }
}
