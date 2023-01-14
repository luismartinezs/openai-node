function useState<T>(initialState: T): [() => T, (newState: T) => void] {
  let state = initialState;
  function setState(newState: T) {
    state = newState;
  }
  function getState() {
    return state;
  }
  return [getState, setState];
}

export { useState };
