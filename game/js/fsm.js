export class FiniteStateMachine {
  constructor(initialState, context) {
    this.currentState = initialState;
    this.context = context;
    this.states = new Map();
  }

  addState(name, definition) {
    this.states.set(name, definition);
    return this;
  }

  setState(nextState) {
    if (this.currentState === nextState || !this.states.has(nextState)) {
      return;
    }
    const previousDef = this.states.get(this.currentState);
    if (previousDef?.onExit) {
      previousDef.onExit(this.context, nextState);
    }
    const previous = this.currentState;
    this.currentState = nextState;
    const nextDef = this.states.get(nextState);
    if (nextDef?.onEnter) {
      nextDef.onEnter(this.context, previous);
    }
  }

  update(dt) {
    const stateDef = this.states.get(this.currentState);
    if (!stateDef) {
      return;
    }
    if (stateDef.onUpdate) {
      stateDef.onUpdate(this.context, dt);
    }
    if (stateDef.transitions) {
      for (const transition of stateDef.transitions) {
        if (transition.when(this.context, dt)) {
          this.setState(transition.to);
          break;
        }
      }
    }
  }
}
