"use strict";
class Code {
    parent = null;
    domObj = null;
    colorArray = null;
    visible = true;
    isBewerted = false;

    constructor(parent) {
        this.parent = parent; // parent = main
        this.domObj = document.createElement("div");
        this.domObj.classList.add("row");
        this.domObj.obj = this;

        this.colorArray = [];
        for (let i = 1; i <= 4; i++) {
            let col = new Color(this, i);
            this.domObj.appendChild(col.domObj);
            this.colorArray.push(col);
        }
    }

    getPrimitive() {
        let arr = [];
        for (let color of this.colorArray) {
            arr.push(color.currentValue);
        }
        return arr;
    }
}

class Master extends Code {
    constructor(parent) {
        // parent: main!
        super(parent);
        let button = document.createElement("button");
        button.obj = this;
        button.classList.add("neuSpiel");
        button.innerHTML = "Neues\nSpiel";
        button.addEventListener("click", (e) => {
            // cl("Neues Spiel // target", e.target)
            // e.target.parentElement.obj.obj.newGame()
            e.target.obj.parent.newGame();
        });
        this.domObj.appendChild(button);
        // Versteck Button
        button = document.createElement("button");
        button.obj = this;
        button.classList.add("visible");
        button.innerText = "Zeig\nher";
        button.addEventListener("click", (e) => {
            //cl("zeige // e.target", e.target)
            e.target.obj.toggleVisibility();
            if (e.target.obj.visible) {
                e.target.innerText = "Ver-\nsteck";
            } else {
                e.target.innerText = "Zeig\nher";
            }
        });
        this.domObj.appendChild(button);
        this.shuffle();
        this.makeVisible(false);
    }

    getPossibilities() {
        let possibilities = [];
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                for (let k = 0; k < 6; k++) {
                    for (let l = 0; l < 6; l++) {
                        possibilities.push([i, j, k, l]);
                    }
                }
            }
        }
        return possibilities;
    }

    shuffle() {
        for (let color of this.colorArray) {
            color.randomize();
        }
    }

    makeVisible(visible) {
        this.visible = visible;
        for (let color of this.colorArray) {
            color.updateDisplay(visible);
        }
    }

    toggleVisibility() {
        this.makeVisible(!this.visible);
    }
}

class Guess extends Code {
    // Whole Row
    bewertePegs = [];
    bewertung = null;
    possibilitiesInherited = null; // array
    constructor(parent, possibilities) {
        // TODO Master verankern für Bewertung
        super(parent);
        if (possibilities.length === 1) {
            parent.notify("Ich kenne die richtige Lösung ;)");
        } else {
            parent.notify(
                `Neuer Versuch, ${possibilities.length} gültige Möglichkeiten`
            );
        }
        this.possibilitiesInherited = possibilities;
        // Bewerte - Button
        let button = document.createElement("button");
        button.obj = this;
        button.classList.add("bewerte");
        button.innerText = "Bewerten";
        button.addEventListener("click", (e) => {
            //cl("e.target", e.target)
            e.target.obj.bewerte();
        });
        this.domObj.appendChild(button);

        // auto Rate Button
        button = document.createElement("button");
        button.obj = this;
        button.classList.add("autoGuess");
        button.innerHTML = "Auto Rate";
        button.addEventListener("click", (e) => {
            e.target.obj.autoGuess();
        });
        this.domObj.appendChild(button);

        for (let i = 1; i <= 4; i++) {
            let peg = new BewertePeg(this, i);
            this.bewertePegs.push(peg);
            this.domObj.appendChild(peg.domObj);
        }

        // Falls Modus "computerGuess" gesetzt ist, automatisch einen Tipp generieren.
        if (parent.mode === "computerGuess") {
            this.autoGuess();
        }
    }

    isComplete() {
        let complete = true;
        for (let color of this.colorArray) {
            if (!color.isUpdated) {
                complete = false;
            }
        }
        return complete;
    }

    bewerte(master = null) {
        let bewCount;
        if (this.parent.mode === "computerGuess") {
            // Manuelle Bewertung über die Bewertungs-Pegs.
            let schwarze = 0, weisse = 0;
            for (let peg of this.bewertePegs) {
                if (peg.rating === "black") {
                    schwarze++;
                } else if (peg.rating === "white") {
                    weisse++;
                }
            }
            this.bewertung = [schwarze, weisse];
            this.parent.notify(
                `Bewertung: ${schwarze} schwarze und ${weisse} weisse (manuell)`,
            );
        } else {
            if (!this.isComplete()) {
                this.parent.notify(
                    "Code ist nicht fertig, kann nicht bewerten",
                );
                return;
            }
            if (master === null) {
                master = this.parent.master.getPrimitive();
            }
            this.bewertung = this.getPrimitive();
            this.bewertung = this.getBewertung(master, this.bewertung);
            this.parent.notify(
                `Bewertung: ${this.bewertung[0]} schwarze und ${
                    this.bewertung[1]
                } weisse`,
            );
        }
        bewCount = 1;
        for (let i = 0; i < this.bewertung[0]; i++) {
            this.domObj.getElementsByClassName(`b${bewCount}`)[0].style
                .backgroundColor = "#000";
            bewCount++;
        }
        for (let i = 0; i < this.bewertung[1]; i++) {
            this.domObj.getElementsByClassName(`b${bewCount}`)[0].style
                .backgroundColor = "#fff";
            bewCount++;
        }
        for (; bewCount <= 4; bewCount++) {
            this.domObj.getElementsByClassName(`b${bewCount}`)[0].style
                .backgroundColor = "#888";
        }
        if (!this.isBewerted) {
            if (this.bewertung[0] < 4) {
                this.parent.prependGuess();
            } else {
                this.parent.prependWin();
            }
        } else {
            this.parent.notify("Ist schon bewertet!");
        }
        this.isBewerted = true;
    }

    getPossibilities() {
        let possibilities = [];
        let primitivThis = this.getPrimitive();
        for (let poss of this.possibilitiesInherited) {
            if (
                this.arraysEqual(
                    this.getBewertung(poss, primitivThis),
                    this.bewertung
                )
            ) {
                possibilities.push(poss);
            }
        }
        return possibilities;
    }

    arraysEqual(one, two) {
        if (one.length != two.length) {
            return false;
        }
        for (let i = 0; i < one.length; i++) {
            if (one[i] != two[i]) {
                return false;
            }
        }
        return true;
    }

    getBewertung(parMaster, parGuess) {
        let master = Array.from(parMaster);
        let guess = Array.from(parGuess);
        let schwarze = 0, weisse = 0;
        for (let i = 0; i < guess.length; i++) {
            if (master[i] === guess[i]) {
                schwarze++;
                master[i] = undefined;
                guess[i] = undefined;
            }
        }
        // weisse finden
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === undefined) continue;
            for (let j = 0; j < guess.length; j++) {
                if (master[j] === guess[i]) {
                    weisse++;
                    guess[i] = undefined;
                    master[j] = undefined;
                    break;
                }
            }
        }
        return [schwarze, weisse];
    }
    autoGuess() {
        let bestArray = this.getBestArray(this.possibilitiesInherited);
        let autoGuess = bestArray[Math.floor(Math.random() * bestArray.length)];
        this.updateSelf(autoGuess);
    }

    updateSelf(guess) {
        for (let i = 0; i < 4; i++) {
            this.colorArray[i].setInt(guess[i]);
        }
    }
    getBestArray(arr) {
        // array of guess-arrays
        let dict = new DiversityMap();
        for (let i = 0; i < arr.length; i++) {
            let div = this.getDiversity(arr[i]);
            if (!dict.has(div)) {
                dict.set(div, []);
            }
            dict.get(div).push(arr[i]);
        }
        return dict.getMostDiverseArray();
        // return dict.getFullestArray()
    }

    getDiversity(arr) {
        let symbols = [];
        for (let i = 0; i < arr.length; i++) {
            if (!symbols.includes(arr[i])) {
                symbols.push(arr[i]);
            }
        }
        return symbols.length;
    }
}

class DiversityMap extends Map {
    getFullestArray() {
        let max = 0, result;
        for (let key of this.keys()) {
            if (this.get(key).length > max) {
                max = this.get(key).length;
                result = this.get(key);
            }
        }
        return result;
    }

    getMostDiverseArray() {
        let keys = Array.from(this.keys()).sort();
        return this.get(keys.pop());
    }
}

class BewertePeg {
    parent = null;
    domObj = null;
    rating = "none"; // Mögliche Zustände: "none", "black", "white"

    constructor(parent, i) {
        this.parent = parent;
        let circ = document.createElement("div");
        circ.classList.add("circle");
        circ.classList.add("bew");
        circ.classList.add(`b${i}`);
        circ.style.backgroundColor = "#888";
        circ.addEventListener("click", (e) => {
            // Nur im "computerGuess"-Modus und wenn die Zeile noch nicht bewertet wurde:
            if (main && main.mode === "computerGuess" && !parent.isBewerted) {
                if (this.rating === "none") {
                    this.rating = "black";
                    circ.style.backgroundColor = "#000";
                } else if (this.rating === "black") {
                    this.rating = "white";
                    circ.style.backgroundColor = "#fff";
                } else if (this.rating === "white") {
                    this.rating = "none";
                    circ.style.backgroundColor = "#888";
                }
            }
        });
        this.domObj = circ;
    }
}

class RowWin {
    domObj = null;

    constructor(parent) {
        this.parent = parent;
        this.domObj = document.createElement("div");
        this.domObj.classList.add("row");
        let win = document.createElement("div");
        win.classList.add("win");
        win.innerHTML = "Gewonnen!";
        this.domObj.appendChild(win);
    }
}
