export function closedRoutinePickerState() {
  return {
    open: false,
    routineId: "",
    selectedTaskIds: []
  };
}

export function openRoutinePickerState(routines = []) {
  return {
    open: true,
    routineId: routines[0]?.id || "",
    selectedTaskIds: []
  };
}

export function selectRoutinePickerSource(state, routineId) {
  return {
    ...state,
    routineId,
    selectedTaskIds: []
  };
}

export function toggleRoutinePickerTask(state, taskId) {
  return {
    ...state,
    selectedTaskIds: state.selectedTaskIds.includes(taskId)
      ? state.selectedTaskIds.filter((id) => id !== taskId)
      : [...state.selectedTaskIds, taskId]
  };
}

export function reconcileRoutinePickerState(state, routines = []) {
  if (!state.open || routines.some((routine) => routine.id === state.routineId)) {
    return state;
  }
  return {
    ...state,
    routineId: routines[0]?.id || "",
    selectedTaskIds: []
  };
}
