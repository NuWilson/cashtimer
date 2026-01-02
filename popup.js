const wageInput = document.getElementById("wage");
const elapsedEl = document.getElementById("elapsed");
const earnedEl = document.getElementById("earned");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const resetButton = document.getElementById("reset");
const showGbpToggle = document.getElementById("show-gbp");

const STORAGE_KEY = "cashTimerState";
const GBP_EXCHANGE_RATE = 0.75;
let ticker = null;

const defaultState = {
  hourlyWage: 0,
  accumulatedMs: 0,
  startTimestamp: null,
  isRunning: false,
  showGbp: false
};

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { ...defaultState };
  }

  try {
    return { ...defaultState, ...JSON.parse(raw) };
  } catch (error) {
    console.error("Failed to parse saved timer state", error);
    return { ...defaultState };
  }
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const formatElapsed = (totalMs) => {
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const formatCurrency = (amount, currencySymbol) =>
  `${currencySymbol}${amount.toFixed(2)}`;

const calculateStateTotals = (state) => {
  const liveMs = state.isRunning && state.startTimestamp
    ? Date.now() - state.startTimestamp
    : 0;
  const totalMs = state.accumulatedMs + liveMs;
  const earnedUsd = (state.hourlyWage / 3600) * (totalMs / 1000);
  const earned = state.showGbp ? earnedUsd * GBP_EXCHANGE_RATE : earnedUsd;
  const currencySymbol = state.showGbp ? "£" : "$";
  return { totalMs, earned, currencySymbol };
};

const updateUI = (state) => {
  const { totalMs, earned, currencySymbol } = calculateStateTotals(state);
  elapsedEl.textContent = formatElapsed(totalMs);
  earnedEl.textContent = formatCurrency(earned, currencySymbol);
  if (document.activeElement !== wageInput) {
    wageInput.value = state.hourlyWage ? state.hourlyWage.toFixed(2) : "";
  }
  showGbpToggle.checked = state.showGbp;

  startButton.disabled = state.isRunning || state.hourlyWage <= 0;
  stopButton.disabled = !state.isRunning;
};

const startTicker = (state) => {
  if (ticker) {
    clearInterval(ticker);
  }
  ticker = setInterval(() => updateUI(state), 250);
};

const stopTicker = () => {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
};

let state = loadState();
updateUI(state);
startTicker(state);

wageInput.addEventListener("input", (event) => {
  const value = Number.parseFloat(event.target.value);
  state.hourlyWage = Number.isNaN(value) ? 0 : value;
  saveState(state);
  updateUI(state);
});

showGbpToggle.addEventListener("change", (event) => {
  state.showGbp = event.target.checked;
  saveState(state);
  updateUI(state);
});

startButton.addEventListener("click", () => {
  if (state.isRunning || state.hourlyWage <= 0) {
    return;
  }
  state.isRunning = true;
  state.startTimestamp = Date.now();
  saveState(state);
  updateUI(state);
});

stopButton.addEventListener("click", () => {
  if (!state.isRunning || !state.startTimestamp) {
    return;
  }
  state.accumulatedMs += Date.now() - state.startTimestamp;
  state.isRunning = false;
  state.startTimestamp = null;
  saveState(state);
  updateUI(state);
});

resetButton.addEventListener("click", () => {
  state = {
    ...defaultState,
    hourlyWage: state.hourlyWage,
    showGbp: state.showGbp
  };
  saveState(state);
  updateUI(state);
  stopTicker();
  startTicker(state);
});

window.addEventListener("beforeunload", () => {
  stopTicker();
});
