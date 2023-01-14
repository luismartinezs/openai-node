function useState<T>(initialState: T): [T, (newState: T) => void] {
  let state = initialState;
  function setState(newState: T) {
    state = newState;
  }
  return [state, setState];
}

export { useState }