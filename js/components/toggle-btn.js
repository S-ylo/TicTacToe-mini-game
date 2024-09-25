const shadowDomMarkup = `
<style>
      :host {
        --pad-inline: 10px;
        --pad-block: 10px;
        display: inline-block;
        box-sizing: border-box;
        width: fit-content;
        border: 1px solid gray;
        border-radius: 4px;
        cursor: pointer;
        background-color:#eee;
      }

      button {
        border: none;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        font: inherit;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: transparent;
        padding-inline: var(--pad-inline, 0);
        padding-block: var(--pad-block, 0);
        color: inherit;
        cursor: inherit;
      }


      button:focus {
        outline: none;
      }


      button span,
      ::slotted(*) {
        transition-duration: 300ms;
        transition-behavior: allow-discrete;
        transition-property: display, transform, scale, translate, rotate, opacity;
      }

      :host([state="on"]) slot[name="off"] {
        display: none;

      }

      :host([state="off"]) slot[name="on"] {
        display: none;
      }

      /* default state switch transition */
      @starting-style {

        ::slotted(*),
        button span {
          opacity: 0;
          scale: .5;
        }
      }
    </style>

    <button>
      <slot name="on">
        <span>On</span>
      </slot>
      <slot name="off">
        <span>Off</span>
      </slot>
    </button>`;

class ToggleButton extends HTMLElement {
  static observedAttributes = ["state", "mute"];
  // instance property
  currentState = "on";
  muted = false;
  whenTurnOn = null;
  whenTurnOff = null;
  sounds = {
    on: null,
    off: null,
  }

  // state change Event
  stateEvents = {
    on: new CustomEvent("turnon", { bubbles: false, cancelable: true }),
    off: new CustomEvent("turnoff", { bubbles: false, cancelable: true })
  }
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    // shadow.append(document.getElementById("toggleBtn").content.cloneNode(true));
    shadow.innerHTML = shadowDomMarkup;

    this.addEventListener("click", function (e) {
      this.switchState();
      this.dispatchEvent(this.stateEvents[this.currentState])

      // fix focuswithin behivour
      if (e.pointerType === "mouse" || e.pointerType === "touch") {
        this.blur()
      }

    })

    this.addEventListener("turnon", (event) => {
      if (!this.muted) {
        this.sounds.on && this.playSound(this.sounds.on);
      }
      this.whenTurnOn && this.whenTurnOn(event);
    })

    this.addEventListener("turnoff", (event) => {
      if (!this.muted) {
        this.sounds.off && this.playSound(this.sounds.off);
      }
      this.whenTurnOff && this.whenTurnOff(event);
    })

  }
  // called when observed attribute changes
  attributeChangedCallback(name, old, newValue) {

    switch (name) {
      case "state":
        this.currentState = newValue;
        // this.dispatchEvent(this.stateEvents[newValue]);
        break;
      case "mute":
        this.muted = newValue === "true" ? true : false;
        break;
    }
  }

  // toggle between "on/off" states
  switchState() {
    let newSate = this.getAttribute("state") === "on" ? "off" : "on";
    this.setAttribute("state", newSate);
  }

  // switch element state to a given state value
  switchTo(state) {
    if (state === "on" || state === "off") {
      this.setAttribute("state", state)
    }
  }

  // set sound effect to play with playSound() when state change
  setSoundEffect(state, audio) {
    if (state === "on" || state === "off") {
      this.sounds[state] = audio;
    }
  }

  // play sound from sounds object property of element
  playSound(soundObject) {
    soundObject.cloneNode(true).play();
  }
}

customElements.define("toggle-button", ToggleButton);

