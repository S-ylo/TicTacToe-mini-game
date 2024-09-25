"use strict"
// --------------------------<<{                  }>>--------------------------
// --------------------------<<{ Global Varibales }>>--------------------------
// --------------------------<<{                  }>>--------------------------
const pauseSwitch = document.getElementById("pauseSwitch");
const lightSwitch = document.getElementById("lightSwitch");
const soundSwitch = document.getElementById("soundSwitch");
const resetBtn = document.getElementById("resetBtn");
const gameBox = document.querySelector(".gamebox");

const player1 = {
  // paleyr defaults info => same as html
  name: "Player 1",
  mark: "X",
  color: "#FC6262",
  score: 0,
  // palyer wallet that will contatin player used bucket through the round
  usedBucket: [],
  // confetti properties object
  confettiObject: {
    angle: 50,
    particleCount: 5100,
    spread: 100,
    origin: { y: 1, x: 0 },
  },
  // player related html elements
  htmlElements: {
    self: document.querySelector("#player1"),
    avater: document.querySelector("#player1 .player__avater"),
    mark: document.querySelector("#player1 .player__mark"),
    name: document.querySelector("#player1 .player__name"),
    score: document.querySelector("#player1 .player__score"),
    editor: {
      nameInput: document.querySelector("#p1-menu input[name='name']"),
      avaterPreview: document.querySelector("#p1-menu .avater img"),
      avatersGallary: document.querySelector("#gallary1"),
      colorOptions: document.querySelector("#p1-menu fieldset"),
      applyBtn: document.querySelector("#p1-menu .applyBtn"),
    },
  }
};

const player2 = {
  // paleyr defaults info => same as html
  name: "Player 2",
  mark: "O",
  color: "#396AEB",
  score: 0,
  // palyer wallet that will contatin player used bucket through the round
  usedBucket: [],
  // confetti properties object
  confettiObject: {
    angle: 130,
    particleCount: 100,
    spread: 100,
    origin: { y: 1, x: 1 },
  },
  // player related html elements
  htmlElements: {
    self: document.querySelector("#player2"),
    avater: document.querySelector("#player2 .player__avater"),
    mark: document.querySelector("#player2 .player__mark"),
    name: document.querySelector("#player2 .player__name"),
    score: document.querySelector("#player2 .player__score"),
    editor: {
      nameInput: document.querySelector("#p2-menu input[name='name']"),
      avaterPreview: document.querySelector("#p2-menu .avater img"),
      avatersGallary: document.querySelector("#gallary2"),
      colorOptions: document.querySelector("#p2-menu fieldset"),
      applyBtn: document.querySelector("#p2-menu .applyBtn"),
    },
  }
};

const Game = {
  activePlayer: null, //current active player
  muted: false,
  paused: true,
  roundNumber: 0, // This will be used to ensure that a different player makes the first move in each round. 
  winOptions: new Set(["123", "456", "789", "147", "258", "369", "159", "357"]),//posibble win options.
  soundEffects: {
    click: new Audio("../assets/audios/click.mp3"),
    uiClick: new Audio("../assets/audios/pause.wav"),
    switch: new Audio("../assets/audios/switch.wav"),
    reset: new Audio("../assets/audios/reset.mp3"),
    unmute: new Audio("../assets/audios/unmute.wav"),
    popupShow: new Audio("../assets/audios/popup.wav"),
    tap: new Audio("../assets/audios/tap.wav"),
    win: new Audio("../assets/audios/win.wav"),
  },
  players: { player1, player2 },

  // Helper Methods

  /**
 * Plays a sound effect if the game is not muted and the sound effect exists.
 *
 * @param {keyof typeof this.soundEffects} soundName - The name of the sound effect to play.
 */
  playSound(soundName) {
    if (!this.muted && this.soundEffects[soundName]) {
      this.soundEffects[soundName].cloneNode().play();
    }
  },

  enterFocusMode() {
    // Resume (start) Game
    Game.paused = false;

    //Set active player and for each round choose diffrent player to start first move. 
    if (!this.activePlayer) this.activePlayer = [player1, player2][Game.roundNumber % 2];
    this.activePlayer.htmlElements.self.classList.add("player--active");

    // prevent players from opening their editor menu or reset the game 
    document.querySelector("button[popovertarget='p1-menu']").disabled = true;
    document.querySelector("button[popovertarget='p2-menu']").disabled = true;
    resetBtn.disabled = true;
  },

  leaveFocusMode() {
    // Pause Game
    Game.paused = true;

    // remove Style of the current active player.
    this.activePlayer.htmlElements.self.classList.remove("player--active");

    // allow palyers to open thier editor menu or reset the game
    document.querySelector("button[popovertarget='p1-menu']").disabled = false;
    document.querySelector("button[popovertarget='p2-menu']").disabled = false;
    resetBtn.disabled = false;
  },

  /**
 * Swaps the active player between player1 and player2.
 */
  swapActivePlayer() {
    this.activePlayer.htmlElements.self.classList.remove("player--active");
    if (this.activePlayer === player1) {
      this.activePlayer = player2;
    } else if (this.activePlayer === player2) {
      this.activePlayer = player1;
    }
    this.activePlayer.htmlElements.self.classList.add("player--active");
    this.markNextMoveBucket();
  },

  /**
   * Retrieves a bucket element from the DOM based on its ID.
   *
   * @param {number} id - The ID of the bucket element to retrieve.
   * @returns {HTMLDivElement | null} The bucket element if found, or null if the ID is invalid.
   */
  getBucketElement(id) {
    if (id < 1 || id > 9) return null;
    return document.getElementById(`bucket${id}`);
  },

  /**
 * Fills a bucket element with the active player's mark and color.
 *
 * @param {HTMLDivElement} bucketElement - The bucket element to fill.
 */
  fillBucket(bucketElement) {
    // first get css variable for active player
    let fillColor = this.activePlayer === player1 ? "--p1-brand" : "--p2-brand";
    bucketElement.innerHTML = `
    <span class="bucket__value" style="--fill-color:var(${fillColor})">
      ${this.activePlayer.mark}
    </span>`;
  },

  /**
 * Moves the value (mark) from one bucket to another.
 *
 * @param {HTMLElement} fromBucket - The bucket element from which the value will be moved.
 * @param {HTMLElement} toBucket - The bucket element to which the value will be moved.
 */
  moveBucketValue(fromBucket, toBucket) {
    toBucket.append(fromBucket.querySelector(".bucket__value"))
  },

  /**
   * Marks the next bucket for the active player that will be moved.
   * */
  markNextMoveBucket() {
    if (this.activePlayer.usedBucket.length < 3) return;
    let targetBucket = this.getBucketElement(this.activePlayer.usedBucket[0]);
    let oldTarget = document.querySelector(".next-move");
    oldTarget?.classList.remove("next-move");
    targetBucket?.classList.add("next-move")
  },

  // using 3rd party function to show confetti for the winner player
  showConfetti() {
    confetti(this.activePlayer.confettiObject);
  },

  // increment the winner score by 1
  editWinnerScore() {
    let newScore = ++(this.activePlayer.score);
    this.activePlayer.htmlElements.score.textContent = newScore;
  },

  /**
 * Ends the current round of the game and prepare the game to next round
 */
  endRound() {
    pauseSwitch.click();
    this.editWinnerScore();
    this.playSound("win");
    this.showConfetti();
    this.clearGameBox();
    this.roundNumber++;
    this.activePlayer = null;
    updateLocalStorage();
  },

  /**
 * Clears the game board and displays a winner dialog for 3 seconds before transitioning to the next round.
 * @returns {Promise<void>} Resolves after the clearing process is complete.
 */
  async clearGameBox() {
    document.querySelector("dialog").showModal();
    // wait 3 seconds before next round
    await new Promise(r => {
      document.querySelector(".winner-name").textContent = Game.activePlayer.name;
      setTimeout(r, 3000);
    });
    document.querySelector("dialog").close();

    for (let bucket of document.getElementsByClassName("bucket")) {
      bucket.innerHTML = ""
    }

    player1.usedBucket = [];
    player2.usedBucket = [];
    document.querySelector(".next-move")?.classList.remove("next-move");
  },

  /**  
   ** Reset Score to be 0 - 0 
   ** clear game board.
   */
  reset() {
    player1.score = player2.score = this.roundNumber = 0;
    player1.htmlElements.score.textContent = player2.htmlElements.score.textContent = "0";

    for (let bucket of document.getElementsByClassName("bucket")) {
      bucket.innerHTML = ""
    }

    player1.usedBucket = [];
    player2.usedBucket = [];
    document.querySelector(".next-move")?.classList.remove("next-move");
    updateLocalStorage();
  },

  /**
 * Initializes a player object with data potentially retrieved from local storage.
 *
 * This function takes a player object and attempts to load its information from Local Storage based on a key derived from the player object. If data is found, it updates the player object's properties and DOM elements with the retrieved values.
 *
 * @param {typeof player1} player - The player object to be initialized.
 */
  initializePlayer(player) {
    let storageKey = player === player1 ? "p1" : "p2";
    const data = JSON.parse(localStorage.getItem(storageKey));

    if (data) {
      player.name = data.name;
      player.color = data.color;
      player.score = data.score;

      // prepare player info
      player.htmlElements.name.innerHTML = data.name;
      player.htmlElements.score.innerHTML = data.score;
      player.htmlElements.editor.nameInput.value = data.name;

      // prepare selected avater
      player.htmlElements.avater.src = data.avaterSrc;
      player.htmlElements.editor.avaterPreview.src = data.avaterSrc;

      let oldAvater = player.htmlElements.editor.avatersGallary.querySelector(".gallary__item--selected");
      oldAvater.classList.remove("gallary__item--selected");
      oldAvater.removeAttribute("aria-selected");

      let newAvater = player.htmlElements.self.querySelectorAll(".gallary__item")[+(data.avaterSrc.match(/\d+/)[0]) - 1];
      newAvater.classList.add("gallary__item--selected");
      oldAvater.setAttribute("aria-selected", "true");

      // prepare selected color
      document.body.style.setProperty(data.cssColorVarName, data.color)
      let oldColor = player.htmlElements.editor.colorOptions.querySelector('input[checked]');
      oldColor.removeAttribute("checked");
      oldColor.removeAttribute("aria-checked");

      let newColor = player.htmlElements.editor.colorOptions.querySelector(`input[style='--brand:${data.color}']`);
      newColor.setAttribute("checked", "true");
      newColor.setAttribute("aria-checked", "true");
    }
  }
}


// --------------------------<<{                }>>--------------------------
// --------------------------<<{ initialization }>>--------------------------
// --------------------------<<{                }>>--------------------------
let p1 = initialize();
let p2 = new Promise(r => window.onload = () => r("loading done"));
let p3 = new Promise(r => setTimeout(r, 2000)); //just to be a minimum loading time [can be deleted].

// show loading screen as modal untill page finishies loading
document.querySelector("#loadingScreen").showModal();

// page content will showen after these 3 promises resolved 
Promise.allSettled([p1, p2, p3]).then(v => {
  document.querySelector(".page-content").hidden = false;
  document.querySelector("#loadingScreen").close();
});


// --------------------------<<{                }>>--------------------------
// --------------------------<<{ Event Handlers }>>--------------------------
// --------------------------<<{                }>>--------------------------
pauseSwitch.whenTurnOn = function (event) {
  pauseSwitch.setAttribute("aria-label", "Pause");
  Game.enterFocusMode();
  Game.playSound("uiClick");
}

pauseSwitch.whenTurnOff = function (event) {
  pauseSwitch.setAttribute("aria-label", "Start");
  Game.leaveFocusMode();
  Game.playSound("uiClick");
}

lightSwitch.whenTurnOn = function (event) {
  lightSwitch.setAttribute("aria-label", "Turn off lights"); // tip content;
  changeThemeTo("light");
  Game.playSound("switch");
}

lightSwitch.whenTurnOff = function (event) {
  lightSwitch.setAttribute("aria-label", "Turn on lights"); // tip content;
  changeThemeTo("dark");
  Game.playSound("switch");
}

soundSwitch.whenTurnOn = function (event) {
  soundSwitch.setAttribute("aria-label", "Mute"); // tip content;
  Game.muted = false;
  Game.playSound("unmute");
}

soundSwitch.whenTurnOff = function (event) {
  soundSwitch.setAttribute("aria-label", "Unmute"); // tip content;
  Game.playSound("click");
  Game.muted = true;
}

resetBtn.addEventListener("click", (e) => {
  Game.playSound("reset");
  Game.reset()
})

// handle changes in players avater gallary element when user select a new avater from gallary
addHandlers({
  targets: [
    player1.htmlElements.editor.avatersGallary,
    player2.htmlElements.editor.avatersGallary
  ],
  events: ["click", "keypress"],
  callbacks: [changeSelectedAvater]
})

// handle changes in palyer editor element when user select a new color
addHandlers({
  targets: [
    player1.htmlElements.editor.colorOptions,
    player2.htmlElements.editor.colorOptions],
  events: ["click"],
  callbacks: [changeSelectedColor]
})

// handle when user click on apply button in editor menu
addHandlers({
  targets: [
    player1.htmlElements.editor.applyBtn,
    player2.htmlElements.editor.applyBtn,
  ],
  events: ["click"],
  callbacks: [updatePlayerInfo, updateLocalStorage]
})

// for playing sound effect when a popover opened.
addHandlers({
  targets: document.querySelectorAll("[popover]"),
  events: ["toggle"],
  callbacks: [(e) => { if (e.newState === "open") Game.playSound("popupShow") }]
})

// Game logic handler
gameBox.addEventListener("click", function (e) {
  let selectedBuckedt = e.target.closest(".bucket");

  if (!Game.paused && Game.activePlayer && selectedBuckedt && selectedBuckedt.childElementCount <= 0) {

    if (Game.activePlayer.usedBucket.length < 3) {
      // when palyer still not used his 3 buckets
      Game.fillBucket(selectedBuckedt)
    } else {
      // when palyer used his 3 buckets 
      Game.moveBucketValue(Game.getBucketElement(Game.activePlayer.usedBucket.shift()), selectedBuckedt);
    }
    // add the selected bucket to player wallet
    Game.activePlayer.usedBucket.push(selectedBuckedt.id.slice(-1));

    // check if the player win the round
    let isWin = Game.winOptions.has(Game.activePlayer.usedBucket.slice().sort().join(""));

    if (isWin) {
      // end round if the current palyer win the round
      Game.endRound();
    } else {
      // or continue the game and swap player
      Game.swapActivePlayer();
    }

    Game.playSound("tap");
  }
})


// --------------------------<<{                  }>>--------------------------
// --------------------------<<{ Global Functions }>>--------------------------
// --------------------------<<{                  }>>--------------------------
/**
 * Initializes the page by setting the page theme and initializing two players.
 * 
 * @async
 * @function initialize
 * @returns {Promise<string>} A promise that resolves to a string indicating initialization is done.
 */
async function initialize() {
  initializePageTheme();
  Game.initializePlayer(player1);
  Game.initializePlayer(player2);
  return "initialize done";
}

/**
 * Changes the theme of the page and stores the preference in local storage.
 *
 * @function changeThemeTo
 * @param {"light"|"dark"} theme - The desired theme, either "dark" or "light" mode.
 */
function changeThemeTo(theme) {
  // Store the selected theme in localStorage
  localStorage.setItem("theme", theme);

  if (theme === "dark") {
    document.body.classList.remove("light-mode");
  } else if (theme === "light") {
    document.body.classList.add("light-mode");
  }
}

/**
 ** Initializes the page theme based on the user's preference or the stored value in localStorage.
 ** If no theme is stored, it checks the user's system preference for dark mode.
 ** It also updates the light switch button's state and accessibility label.
 *
 * @function initializePageTheme
 */
function initializePageTheme() {
  // if there is no stored value.
  if (!localStorage.getItem("theme")) {

    // Check if the user prefers dark mode using the browser's media query.
    let userPreferDark = window.matchMedia("(prefers-color-scheme:dark)").matches;

    if (userPreferDark) {
      changeThemeTo("dark");
    } else {
      changeThemeTo("light");
    }

  } else {
    // If a theme is already stored in localStorage, retrieve it
    let storedThemeValue = localStorage.getItem("theme");

    changeThemeTo(storedThemeValue);

    if (storedThemeValue === "dark") {
      lightSwitch.switchTo("off"); // Switch to "off" if the theme is dark.
      lightSwitch.setAttribute("aria-label", "Turn on lights")
    } else {
      lightSwitch.switchTo("on") // Switch to "on" if the theme is light.
      lightSwitch.setAttribute("aria-label", "Turn off lights")
    }
  }
}

/**
 * Adds multiple event listeners to multiple targets with multiple callback functions.
 * 
 * @function addHandlers
 * @param {Object} config - An object containing the targets, events, and callbacks.
 * @param {Element[]} config.targets - An array of DOM elements to which the event listeners will be attached.
 * @param {string[]} config.events - An array of event types (e.g., "click", "mouseover") to listen for.
 * @param {Function[]} config.callbacks - An array of callback functions to be executed when the event is triggered.
 */
function addHandlers({ targets, events, callbacks }) {
  try {
    for (let target of targets) {
      for (let event of events) {
        for (let callback of callbacks) {
          target.addEventListener(event, callback);
        }
      }
    }
  } catch (e) {
    console.error(e)
  }
}

/**
 * Handles avatar selection changes, updating the selected option in the gallery and reflecting the change in the player avatar preview in player editor menu.
 * 
 * @function changeSelectedAvater
 * @param {MouseEvent | KeyboardEvent} event - The event triggered by the user interaction (e.g., click or keypress).
 */
function changeSelectedAvater(event) {
  let newSelectedOption = event.target.closest("li");
  let oldSelectedOption = event.currentTarget.querySelector(".gallary__item--selected");
  let targetPlayer = event.target.closest(".player").id; // => 'plyaer1' | 'player2'

  // make sure that user select a new option
  if (newSelectedOption === null || newSelectedOption === oldSelectedOption) return;
  if (event.type === "keypress" && event.code !== "Space" && event.code !== "Enter") return;

  oldSelectedOption.classList.remove("gallary__item--selected");
  oldSelectedOption.removeAttribute("aria-selected");

  newSelectedOption.classList.add("gallary__item--selected");
  newSelectedOption.setAttribute("aria-selected", "true");

  Game.playSound("click");
  updateAvaterPreview(targetPlayer, newSelectedOption.querySelector("img").src)
}

/**
 * Updates the avatar preview for a specific player based on a new source URL.
 *
 * @param {"player1" | "player2"} targetPlayerId - The player ID (e.g., "player1" or "player2").
 * @param {string} newSrc - The URL of the new avatar image.
 */
function updateAvaterPreview(targetPlayerId, newSrc) {
  Game.players[target].htmlElements.editor.avaterPreview.src = newSrc;
}

/**
 * Handles changing the selected color for a player or other element.
 *
 * @param {MouseEvent | KeyboardEvent} event - The event object triggered by the user interaction. Expected to be an event with a `target` and `currentTarget` property.
 */
function changeSelectedColor(event) {
  let newSelectedOption = event.target.closest("input");
  let oldSelectedOption = event.currentTarget.querySelector("input[checked]");

  // make sure that user select a new option
  if (newSelectedOption === null || newSelectedOption === oldSelectedOption) return;

  oldSelectedOption.removeAttribute("checked");
  oldSelectedOption.removeAttribute("aria-checked");

  newSelectedOption.setAttribute("checked", "");
  newSelectedOption.setAttribute("aria-checked", "true");

  Game.playSound("click")
}

/**
 ** this function will be invoked when user click applay button.
 ** Updates player information based on user input in the editor.
 *
 * @param {Event} event - The event object triggered by the user interaction. Expected to have a `target` property that leads to a player element with the class `".player"`.
 */
function updatePlayerInfo(event) {
  const id = event.target.closest(".player").id; // => 'player1' | 'player2'
  const targetPlayer = Game.players[id];

  if (targetPlayer) {
    const newValues = {
      name: targetPlayer.htmlElements.editor.nameInput.value || id,
      color: targetPlayer.htmlElements.editor.colorOptions.querySelector("[checked]").computedStyleMap().get("--brand")[0],
      avaterSrc: new URL(targetPlayer.htmlElements.editor.avaterPreview.src).pathname,
    }

    // update player Name
    targetPlayer.name = targetPlayer.htmlElements.name.textContent = newValues.name;

    // update player avater image
    targetPlayer.htmlElements.avater.src = newValues.avaterSrc;

    // upadte player color 
    targetPlayer.color = newValues.color;
    document.body.style.setProperty({ player1: `--p1-brand`, player2: `--p2-brand` }[id], newValues.color);

  }
  Game.playSound("click");
}

/**
 * Saves game data to Local Storage.
 *
 * This function stores the current game state and player information in Local Storage for potential retrieval later.
 */
function updateLocalStorage() {
  const gameData = {
    roundNumber: Game.roundNumber,
    muted: Game.muted
  };

  const p1Data = {
    name: player1.name,
    color: player1.color,
    score: player1.score,
    avaterSrc: new URL(player1.htmlElements.avater.src).pathname,
    cssColorVarName: "--p1-brand",
  };

  const p2Data = {
    name: player2.name,
    color: player2.color,
    score: player2.score,
    avaterSrc: new URL(player2.htmlElements.avater.src).pathname,
    cssColorVarName: "--p2-brand"
  };

  localStorage.setItem("game", JSON.stringify(gameData));
  localStorage.setItem("p1", JSON.stringify(p1Data));
  localStorage.setItem("p2", JSON.stringify(p2Data));
}


