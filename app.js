/* Everything is Mathematics: the six playground games, plus the drawings in "Maths is hiding everywhere". */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const shuffle = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const article = (word) => (/^[aeiou]/.test(word) ? "an" : "a");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Stars and settings live only in this browser. Private windows can refuse storage, so every call is guarded.
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem("eim-" + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem("eim-" + key, JSON.stringify(value));
      } catch (e) { /* not saved, still playable */ }
    },
  };

  const C = {
    ink: "#27215a",
    violet: "#6e6abe",
    cloud: "#dfdefd",
    pink: "#ffc2dc",
    orchid: "#b85a9d",
    mint: "#53ddc9",
    teal: "#3c8e97",
    tealDeep: "#224959",
    yellow: "#fec425",
    yellowLight: "#ffd45e",
  };

  /* ---------- Drawing helpers ---------- */

  const pt = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;
  const rad = (deg) => (deg * Math.PI) / 180;

  // Points of a regular polygon; turn = -90 puts the first corner at the top.
  const polygon = (sides, r, cx = 100, cy = 100, turn = -90) =>
    Array.from({ length: sides }, (_, i) => {
      const a = rad(turn + (i * 360) / sides);
      return pt(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }).join(" ");

  const starPoints = (points, outer, inner, cx = 100, cy = 100) =>
    Array.from({ length: points * 2 }, (_, i) => {
      const r = i % 2 ? inner : outer;
      const a = rad(-90 + (i * 180) / points);
      return pt(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }).join(" ");

  // One slice of a circle, from a0 to a1 degrees clockwise from 12 o'clock.
  function wedge(cx, cy, r, a0, a1) {
    const at = (a) => {
      const t = rad(a - 90);
      return `${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`;
    };
    return `M${cx} ${cy}L${at(a0)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${at(a1)}Z`;
  }

  /* ---------- Answer choices ---------- */

  const numberChoice = (n) => ({ value: String(n), html: String(n), label: String(n) });

  // The right answer plus `count` wrong ones, taken from the likely mistakes first, then the nearest numbers.
  function nearby(answer, mistakes, count = 3, min = 0) {
    const picked = shuffle([...new Set(mistakes)].filter((v) => v !== answer && v >= min)).slice(0, count);
    for (let step = 1; picked.length < count; step++) {
      for (const v of [answer + step, answer - step]) {
        if (v >= min && !picked.includes(v) && picked.length < count) picked.push(v);
      }
    }
    return shuffle([answer, ...picked]).map(numberChoice);
  }

  /* ---------- Count it ---------- */

  const THINGS = [
    { id: "i-sparkle", one: "star", many: "stars", color: C.yellow },
    { id: "i-daisy", one: "flower", many: "flowers", color: C.pink, plain: true },
    { id: "i-heart", one: "heart", many: "hearts", color: C.orchid },
    { id: "i-apple", one: "apple", many: "apples", color: C.mint },
    { id: "i-fish", one: "fish", many: "fish", color: C.violet },
  ];

  function countRound(level) {
    const n = rand(level.min, level.max);
    const thing = pick(THINGS);
    const items = Array.from({ length: n }, (_, i) =>
      `<svg class="thing${thing.plain ? " thing-plain" : ""}" style="--i:${i};color:${thing.color}" aria-hidden="true"><use href="#${thing.id}"/></svg>`
    ).join("");
    return {
      key: thing.id + n,
      say: `How many ${thing.many} can you count?`,
      question: `How many ${thing.many} can you count?`,
      visual: `<div class="count-grid" style="--cols:${Math.min(5, n)}" role="img" aria-label="A group of ${thing.many} to count">${items}</div>`,
      answer: n,
      choices: nearby(n, [n - 1, n + 1, n - 2, n + 2], level.max === 5 ? 2 : 3, 1),
      hint: "Touch each one as you count it. Full rows have 5.",
      explain: `There ${n === 1 ? "is" : "are"} ${n} ${n === 1 ? thing.one : thing.many}.`,
    };
  }

  /* ---------- Add & take away ---------- */

  function tenFrames(a, b, op) {
    const total = op === "+" ? a + b : a;
    let html = "";
    for (let f = 0; f < Math.ceil(total / 10); f++) {
      let cells = "";
      for (let c = 0; c < 10; c++) {
        const i = f * 10 + c;
        let dot = "";
        if (op === "+") {
          if (i < a) dot = `<i class="dot" style="animation-delay:${i * 30}ms"></i>`;
          else if (i < a + b) dot = `<i class="dot dot-b" style="animation-delay:${i * 30}ms"></i>`;
        } else if (i < a) {
          dot = `<i class="dot${i >= a - b ? " gone" : ""}" style="animation-delay:${i * 30}ms"></i>`;
        }
        cells += `<span class="cell">${dot}</span>`;
      }
      html += `<div class="frame">${cells}</div>`;
    }
    const label = op === "+" ? `${a} purple dots and ${b} pink dots` : `${a} dots with ${b} crossed out`;
    return `<div class="frames" role="img" aria-label="${label}">${html}</div>`;
  }

  function sumsRound(level) {
    const op = pick(level.ops);
    const low = Math.max(3, Math.round(level.max / 4));
    let a, b, answer;
    if (op === "+") {
      answer = rand(low, level.max);
      a = rand(1, answer - 1);
      b = answer - a;
    } else {
      a = rand(low, level.max);
      b = rand(1, a - 1);
      answer = a - b;
    }
    const frames = level.max <= 20;
    const adding = op === "+";
    return {
      key: `${a}${op}${b}`,
      say: `What is ${a} ${adding ? "plus" : "take away"} ${b}?`,
      question: `<span class="sum">${a} ${op} ${b} = <span class="blank">?</span></span>`,
      visual: frames ? tenFrames(a, b, op) : "",
      answer,
      choices: frames
        ? nearby(answer, [answer + 1, answer - 1, answer + 2, answer - 2])
        : nearby(answer, [answer + 10, answer - 10, answer + 1, answer - 1, answer + 2]),
      hint: frames
        ? (adding ? "Count all the dots together." : "Count the dots that aren’t crossed out.")
        : (adding ? "Add the tens first, then the ones." : "Take away the tens first, then the ones."),
      explain: adding ? `${a} and ${b} more makes ${answer}.` : `${a} take away ${b} leaves ${answer}.`,
    };
  }

  /* ---------- Times tables ---------- */

  function dotArray(rows, cols) {
    const size = Math.max(8, Math.min(24, Math.floor(200 / Math.max(rows, cols))));
    let dots = "";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) dots += `<i class="${r % 2 ? "alt" : ""}" style="animation-delay:${r * 40}ms"></i>`;
    }
    const words = `${rows} ${rows === 1 ? "row" : "rows"} of ${cols}`;
    return `<div class="array-wrap"><div class="array" style="--cols:${cols};--dot:${size}px" role="img" aria-label="${words} dots">${dots}</div><p class="array-label">${words}</p></div>`;
  }

  function timesRound(level) {
    const table = level.table || rand(2, 12);
    const groups = rand(1, 12);
    const answer = groups * table;
    const start = Array.from({ length: Math.min(groups - 1, 3) }, (_, i) => (i + 1) * table).join(", ");
    return {
      key: `${groups}x${table}`,
      say: `What is ${groups} times ${table}?`,
      question: `<span class="sum">${groups} × ${table} = <span class="blank">?</span></span>`,
      visual: dotArray(groups, table),
      answer,
      choices: nearby(answer, [answer + table, answer - table, answer + groups, answer - groups, answer + 1, answer - 1], 3, 1),
      hint: groups === 1
        ? "There’s just one row. How many dots are in it?"
        : `Count in ${table}s, one row at a time: ${start}…`,
      explain: `${groups} ${groups === 1 ? "row" : "rows"} of ${table} make ${answer}.`,
    };
  }

  /* ---------- Shapes ---------- */

  const SHAPES = {
    circle: { sides: 0, draw: () => `<circle cx="100" cy="100" r="82"/>`, fact: "A circle has no corners and no straight sides. That’s why wheels roll so smoothly." },
    square: { sides: 4, draw: () => `<rect x="28" y="28" width="144" height="144" rx="3"/>`, fact: "All 4 sides of a square are the same length, and all 4 corners are square." },
    triangle: { sides: 3, draw: () => `<polygon points="${polygon(3, 90, 100, 116)}"/>`, fact: "Triangles are very strong, so bridges and cranes are full of them." },
    rectangle: { sides: 4, draw: () => `<rect x="12" y="50" width="176" height="100" rx="3"/>`, fact: "Doors, books and screens are rectangles: 4 sides and 4 square corners." },
    oval: { sides: 0, draw: () => `<ellipse cx="100" cy="100" rx="90" ry="58"/>`, fact: "The word oval comes from the Latin word for egg." },
    semicircle: { sides: 1, draw: () => `<path d="M18 138A82 82 0 0 1 182 138Z"/>`, fact: "A semicircle is half a circle. Put two together and you get a whole one!" },
    rhombus: { sides: 4, draw: () => `<polygon points="60,42 185,42 140,158.6 15,158.6"/>`, fact: "A rhombus has 4 equal sides. It looks like a square that has been pushed over." },
    pentagon: { sides: 5, draw: () => `<polygon points="${polygon(5, 88, 100, 106)}"/>`, fact: "An old-style football has 12 black pentagons on it." },
    hexagon: { sides: 6, draw: () => `<polygon points="${polygon(6, 88, 100, 100, 0)}"/>`, fact: "Bees build their honeycomb out of hexagons." },
    heptagon: { sides: 7, draw: () => `<polygon points="${polygon(7, 88, 100, 104)}"/>`, fact: "The UK 50p coin has 7 sides." },
    octagon: { sides: 8, draw: () => `<polygon points="${polygon(8, 88, 100, 100, -67.5)}"/>`, fact: "Stop signs in lots of countries are octagons." },
    star: { sides: 10, draw: () => `<polygon points="${starPoints(5, 92, 38, 100, 106)}"/>`, fact: "This star has 5 points, but 10 corners. Can you find them all?" },
  };

  function shapesRound(level) {
    const name = pick(level.pool);
    const shape = SHAPES[name];
    const fill = pick([C.yellow, C.mint, C.pink, C.cloud]);
    const art = `<svg class="shape-art" viewBox="0 0 200 200" role="img" aria-label="A shape"><g fill="${fill}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round">${shape.draw()}</g></svg>`;
    if (level.ask === "sides") {
      return {
        key: name,
        say: "How many sides does this shape have?",
        question: "How many sides does this shape have?",
        visual: art,
        answer: shape.sides,
        choices: nearby(shape.sides, [shape.sides + 1, shape.sides - 1, shape.sides + 2], 3, 3),
        hint: "Put your finger on one side and count your way round.",
        explain: `That’s ${article(name)} ${name}, with ${shape.sides} sides. ${shape.fact}`,
      };
    }
    const others = shuffle(level.pool.filter((n) => n !== name)).slice(0, 3);
    return {
      key: name,
      say: "What shape is this?",
      question: "What shape is this?",
      visual: art,
      answer: name,
      choices: shuffle([name, ...others]).map((n) => ({ value: n, html: cap(n), label: n })),
      choiceClass: "choices-words",
      hint: "Count its corners. Are the sides straight or curved?",
      explain: `It’s ${article(name)} ${name}! ${shape.fact}`,
    };
  }

  /* ---------- What comes next? ---------- */

  const PIECES = [
    { shape: "circle", color: C.yellow, name: "yellow circle" },
    { shape: "triangle", color: C.pink, name: "pink triangle" },
    { shape: "square", color: C.mint, name: "green square" },
    { shape: "star", color: C.violet, name: "purple star" },
    { shape: "hexagon", color: C.teal, name: "blue hexagon" },
  ];
  const UNITS = ["AB", "ABC", "AAB", "ABB", "AABB"];

  function pieceArt(piece) {
    const d = {
      circle: `<circle cx="20" cy="20" r="15"/>`,
      triangle: `<polygon points="${polygon(3, 18, 20, 23)}"/>`,
      square: `<rect x="6" y="6" width="28" height="28" rx="2"/>`,
      star: `<polygon points="${starPoints(5, 18, 8, 20, 21)}"/>`,
      hexagon: `<polygon points="${polygon(6, 16, 20, 20, 0)}"/>`,
    }[piece.shape];
    return `<svg class="piece" viewBox="0 0 40 40" aria-hidden="true"><g fill="${piece.color}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round">${d}</g></svg>`;
  }

  function shapePattern() {
    const unit = pick(UNITS);
    const letters = [...new Set(unit)];
    const chosen = shuffle(PIECES).slice(0, letters.length + 1); // one spare piece as a wrong answer
    const byLetter = Object.fromEntries(letters.map((l, i) => [l, chosen[i]]));
    const shown = unit.length * 2 + rand(0, unit.length - 1);
    const seq = Array.from({ length: shown }, (_, i) => byLetter[unit[i % unit.length]]);
    const answer = byLetter[unit[shown % unit.length]];
    return {
      key: unit + chosen.map((p) => p.shape).join(),
      say: "Which shape comes next in the pattern?",
      question: "Which shape comes next?",
      visual: `<div class="pattern-row" role="img" aria-label="${seq.map((p) => p.name).join(", ")}, then a gap">${seq.map(pieceArt).join("")}<span class="piece-gap">?</span></div>`,
      answer: answer.shape,
      choices: shuffle(chosen).map((p) => ({ value: p.shape, html: pieceArt(p), label: p.name })),
      hint: `Say it out loud: ${seq.slice(0, unit.length + 1).map((p) => p.shape).join(", ")}…`,
      explain: `The pattern goes ${[...unit].map((l) => byLetter[l].shape).join(", ")}, then starts again.`,
    };
  }

  function numberPattern() {
    const kind = pick(["up", "up", "down", "double"]);
    let terms, answer, explain, mistakes;
    if (kind === "double") {
      const start = pick([1, 2, 3, 5]);
      terms = Array.from({ length: 5 }, (_, i) => start * 2 ** i);
      answer = terms[4] * 2;
      explain = "Each number is double the one before.";
      mistakes = [terms[4] + (terms[4] - terms[3]), answer + terms[0], answer - 2, answer + 1];
    } else {
      const step = pick(kind === "up" ? [1, 2, 3, 5, 10] : [1, 2, 5, 10]);
      const dir = kind === "up" ? 1 : -1;
      const start = kind === "up" ? rand(0, 20) : step * 5 + rand(0, 15);
      terms = Array.from({ length: 5 }, (_, i) => start + dir * step * i);
      answer = start + dir * step * 5;
      explain = `It goes ${kind} by ${step} each time.`;
      mistakes = [answer + dir * step, answer - dir * step, answer + 1, answer - 1];
    }
    return {
      key: terms.join(),
      say: `What comes next? ${terms.join(", ")}`,
      question: "What number comes next?",
      visual: `<p class="seq">${terms.map((t) => `<span>${t}</span>`).join("")}<span class="blank">?</span></p>`,
      answer,
      choices: nearby(answer, mistakes),
      hint: kind === "double"
        ? "Look at the jumps between the numbers. Are they getting bigger?"
        : "How much do you add or take away to get from one number to the next?",
      explain,
    };
  }

  /* ---------- Fractions ---------- */

  const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];
  const PARTS = {
    2: ["half", "halves"], 3: ["third", "thirds"], 4: ["quarter", "quarters"], 5: ["fifth", "fifths"],
    6: ["sixth", "sixths"], 7: ["seventh", "sevenths"], 8: ["eighth", "eighths"],
  };
  const fractionWords = (a, b) => `${NUMBER_WORDS[a]} ${PARTS[b][a === 1 ? 0 : 1]}`;
  const fractionChoice = ([a, b]) => ({
    value: `${a}/${b}`,
    html: `<span class="frac"><span>${a}</span><span>${b}</span></span>`,
    label: fractionWords(a, b),
  });

  function fractionArt(n, k, form) {
    if (form === "bar") {
      const w = 220 / n;
      const parts = Array.from({ length: n }, (_, i) =>
        `<rect x="${(10 + i * w).toFixed(2)}" y="30" width="${w.toFixed(2)}" height="80" fill="${i < k ? C.pink : "#fff"}"/>`
      ).join("");
      return `<svg class="fraction-art bar" viewBox="0 0 240 140" role="img" aria-label="A bar cut into ${n} equal parts, with ${k} coloured in"><g stroke="${C.ink}" stroke-width="3">${parts}</g><rect x="10" y="30" width="220" height="80" rx="3" fill="none" stroke="${C.ink}" stroke-width="5"/></svg>`;
    }
    const slices = Array.from({ length: n }, (_, i) =>
      `<path d="${wedge(100, 100, 86, (i * 360) / n, ((i + 1) * 360) / n)}" fill="${i < k ? C.pink : "#fff"}"/>`
    ).join("");
    return `<svg class="fraction-art" viewBox="0 0 200 200" role="img" aria-label="A circle cut into ${n} equal parts, with ${k} coloured in"><g stroke="${C.ink}" stroke-width="4" stroke-linejoin="round">${slices}</g></svg>`;
  }

  function fractionsRound(level) {
    const n = pick(level.parts);
    const k = rand(1, n - 1);
    const seen = new Set();
    // A wrong answer must be sayable, and must not be worth the same as the right one (2/4 is also right for 1/2).
    const ok = ([a, b]) => {
      const id = `${a}/${b}`;
      if (a < 1 || a > 8 || !PARTS[b] || a * n === k * b || seen.has(id)) return false;
      seen.add(id);
      return true;
    };
    // Common mix-ups: counting the white parts, off by one, the wrong number of parts, upside down.
    const mistakes = [[n - k, n], [k + 1, n], [k - 1, n], ...level.parts.map((d) => [k, d]), [n, k]];
    const wrong = shuffle(mistakes).filter(ok).slice(0, 3);
    while (wrong.length < 3) {
      const b = pick([2, 3, 4, 6, 8]);
      const guess = [rand(1, b - 1), b];
      if (ok(guess)) wrong.push(guess);
    }
    const g = gcd(k, n);
    return {
      key: `${k}/${n}`,
      say: "What fraction is coloured in?",
      question: "What fraction is coloured in?",
      visual: fractionArt(n, k, pick(["circle", "bar"])),
      answer: `${k}/${n}`,
      choices: shuffle([[k, n], ...wrong]).map(fractionChoice),
      choiceClass: "choices-fractions",
      hint: "Count all the equal parts: that’s the bottom number. The coloured parts are the top number.",
      explain: `${k} out of ${n} equal parts ${k === 1 ? "is" : "are"} coloured in: that’s ${fractionWords(k, n)}.` +
        (g > 1 ? ` It’s the same as ${fractionWords(k / g, n / g)}!` : ""),
    };
  }

  /* ---------- The games ---------- */

  const GAMES = {
    count: {
      title: "Count it",
      levels: [
        { label: "Up to 5", min: 1, max: 5 },
        { label: "Up to 10", min: 3, max: 10 },
        { label: "Up to 20", min: 8, max: 20 },
      ],
      make: countRound,
    },
    sums: {
      title: "Add & take away",
      levels: [
        { label: "Adding to 10", ops: ["+"], max: 10 },
        { label: "Taking away", ops: ["−"], max: 10 },
        { label: "Up to 20", ops: ["+", "−"], max: 20 },
        { label: "Up to 100", ops: ["+", "−"], max: 100 },
      ],
      make: sumsRound,
    },
    times: {
      title: "Times tables",
      levels: [
        ...Array.from({ length: 11 }, (_, i) => ({ label: `×${i + 2}`, aria: `${i + 2} times table`, table: i + 2 })),
        { label: "Mix them up", table: 0 },
      ],
      make: timesRound,
    },
    shapes: {
      title: "Shapes",
      levels: [
        { label: "Easy shapes", pool: ["circle", "square", "triangle", "rectangle"], ask: "name" },
        { label: "Tricky shapes", pool: ["oval", "semicircle", "rhombus", "pentagon", "hexagon", "octagon", "star"], ask: "name" },
        { label: "Count the sides", pool: ["triangle", "square", "rectangle", "rhombus", "pentagon", "hexagon", "heptagon", "octagon"], ask: "sides" },
      ],
      make: shapesRound,
    },
    pattern: {
      title: "What comes next?",
      levels: [
        { label: "Shapes", make: shapePattern },
        { label: "Numbers", make: numberPattern },
      ],
      make: (level) => level.make(),
    },
    fractions: {
      title: "Fractions",
      levels: [
        { label: "Halves & quarters", parts: [2, 4] },
        { label: "All fractions", parts: [2, 3, 4, 5, 6, 8] },
      ],
      make: fractionsRound,
    },
  };

  const PRAISE = ["Brilliant!", "Yes!", "Spot on!", "Fantastic!", "You got it!", "Super!", "Wonderful!", "Nailed it!"];
  const RETRY = ["Not quite.", "Nearly!", "Have another look.", "Ooh, close!"];

  /* ---------- Drawings for "Maths is hiding everywhere" ---------- */

  const ART = {
    // Seeds placed by the golden angle, which is how real sunflowers pack them.
    sunflower() {
      const petals = Array.from({ length: 24 }, (_, i) => `<ellipse cy="-66" rx="11" ry="26" transform="rotate(${i * 15})"/>`).join("");
      const seeds = Array.from({ length: 220 }, (_, i) => {
        const r = 3.3 * Math.sqrt(i + 1);
        const t = (i + 1) * 2.39996;
        return `<circle cx="${(r * Math.cos(t)).toFixed(2)}" cy="${(r * Math.sin(t)).toFixed(2)}" r="${(1.4 + r / 40).toFixed(2)}"/>`;
      }).join("");
      return `<g fill="${C.yellow}" stroke="${C.ink}" stroke-width="2">${petals}</g><circle r="52" fill="${C.tealDeep}" stroke="${C.ink}" stroke-width="2.5"/><g fill="${C.yellowLight}">${seeds}</g>`;
    },
    honeycomb() {
      const r = 24;
      const w = Math.sqrt(3) * r;
      const fills = [C.yellow, C.yellowLight, C.yellow, "#fff3c4"];
      let cells = "";
      for (let row = -1; row < 6; row++) {
        for (let col = -1; col < 6; col++) {
          const cx = col * w + (row % 2 ? w / 2 : 0);
          const cy = row * r * 1.5;
          cells += `<polygon points="${polygon(6, r - 1.5, cx, cy)}" fill="${fills[(((row * 3 + col * 5) % 4) + 4) % 4]}"/>`;
        }
      }
      return `<g stroke="${C.ink}" stroke-width="3" stroke-linejoin="round">${cells}</g>`;
    },
    pizza() {
      let slices = "";
      for (let i = 0; i < 8; i++) {
        if (i === 1 || i === 2) continue; // two slices already eaten
        const mid = rad(i * 45 + 22.5 - 90);
        slices += `<path d="${wedge(0, 0, 82, i * 45, i * 45 + 45)}" fill="${C.yellowLight}"/>` +
          `<circle cx="${(52 * Math.cos(mid)).toFixed(1)}" cy="${(52 * Math.sin(mid)).toFixed(1)}" r="9" fill="${C.orchid}"/>`;
      }
      return `<circle r="92" fill="#fff" stroke="${C.ink}" stroke-width="3"/><circle r="82" fill="none" stroke="${C.ink}" stroke-width="2" stroke-dasharray="3 7" opacity=".35"/><g stroke="${C.ink}" stroke-width="3" stroke-linejoin="round">${slices}</g>`;
    },
    clock() {
      let ticks = "";
      for (let i = 0; i < 60; i++) {
        const five = i % 5 === 0;
        ticks += `<line y1="${five ? -68 : -74}" y2="-80" stroke-width="${five ? 4 : 2}" transform="rotate(${i * 6})"/>`;
      }
      const numbers = [[12, 0], [3, 90], [6, 180], [9, 270]].map(([n, a]) => {
        const t = rad(a - 90);
        return `<text class="clock-num" x="${(54 * Math.cos(t)).toFixed(1)}" y="${(54 * Math.sin(t)).toFixed(1)}">${n}</text>`;
      }).join("");
      return `<circle r="90" fill="#fff" stroke="${C.ink}" stroke-width="5"/><g stroke="${C.ink}" stroke-linecap="round">${ticks}</g>${numbers}` +
        `<g stroke-linecap="round"><line y2="-40" stroke="${C.ink}" stroke-width="8" transform="rotate(305)"/><line y2="-64" stroke="${C.orchid}" stroke-width="5" transform="rotate(60)"/></g>` +
        `<circle r="7" fill="${C.yellow}" stroke="${C.ink}" stroke-width="3"/>`;
    },
  };

  document.querySelectorAll("[data-art]").forEach((svg) => {
    const draw = ART[svg.dataset.art];
    if (draw) svg.innerHTML = draw();
  });

  /* ---------- Header ---------- */

  const header = $("#site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- The board ---------- */

  const els = {
    tiles: [...document.querySelectorAll(".tile")],
    board: $("#board"),
    title: $("#game-title"),
    levels: $("#levels"),
    question: $("#question"),
    visual: $("#visual"),
    choices: $("#choices"),
    feedback: $("#feedback"),
    next: $("#next"),
    streak: $("#streak"),
    stars: $("#star-count"),
    starsChip: $("#stars-chip"),
    speak: $("#speak"),
    sound: $("#sound"),
    reset: $("#reset-stars"),
  };
  if (!els.board) return;

  const savedGame = store.get("game", "count");
  const state = {
    game: GAMES[savedGame] ? savedGame : "count",
    levels: store.get("levels", {}) || {},
    stars: Number(store.get("stars", 0)) || 0,
    sound: store.get("sound", true) !== false,
    streak: 0,
    round: null,
    tries: 0,
    solved: false,
    lastKey: {},
  };

  const levelIndex = (id) => {
    const i = state.levels[id];
    return Number.isInteger(i) && GAMES[id].levels[i] ? i : 0;
  };

  /* ---------- Sound, speech and confetti ---------- */

  let audio;
  function chime(kind) {
    if (!state.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const right = kind === "right";
      const notes = right ? [523.25, 659.25, 783.99] : [220, 196];
      notes.forEach((freq, i) => {
        const t = audio.currentTime + i * (right ? .09 : .14);
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = right ? "triangle" : "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(.0001, t);
        gain.gain.exponentialRampToValueAtTime(.14, t + .02);
        gain.gain.exponentialRampToValueAtTime(.0001, t + .35);
        osc.connect(gain).connect(audio.destination);
        osc.start(t);
        osc.stop(t + .4);
      });
    } catch (e) { /* no Web Audio: play silently */ }
  }

  const canSpeak = "speechSynthesis" in window;
  function speak(text) {
    speechSynthesis.cancel();
    const line = new SpeechSynthesisUtterance(text);
    line.lang = "en-GB";
    line.rate = .9;
    speechSynthesis.speak(line);
  }

  // A little fountain of shapes from the right answer.
  function burst(origin, big) {
    if (reduceMotion) return;
    const box = origin.getBoundingClientRect();
    const layer = document.createElement("div");
    layer.className = "burst";
    layer.style.left = `${box.left + box.width / 2}px`;
    layer.style.top = `${box.top + box.height / 2}px`;
    for (let i = 0; i < (big ? 30 : 14); i++) {
      const bit = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const dist = (big ? 110 : 60) + Math.random() * (big ? 150 : 70);
      bit.className = `bit bit-${pick(["circle", "square", "tri", "star"])}`;
      bit.style.setProperty("--x", `${(Math.cos(angle) * dist).toFixed(0)}px`);
      bit.style.setProperty("--y", `${(Math.sin(angle) * dist).toFixed(0)}px`);
      bit.style.setProperty("--r", `${rand(-360, 360)}deg`);
      bit.style.background = pick([C.yellow, C.pink, C.mint, C.violet, C.orchid]);
      layer.append(bit);
    }
    document.body.append(layer);
    setTimeout(() => layer.remove(), 1000);
  }

  /* ---------- Rounds ---------- */

  function showStars(bump) {
    els.stars.textContent = state.stars;
    if (bump && !reduceMotion) {
      els.starsChip.classList.remove("bump");
      void els.starsChip.offsetWidth; // restart the animation
      els.starsChip.classList.add("bump");
    }
  }

  function renderLevels() {
    const current = levelIndex(state.game);
    els.levels.innerHTML = GAMES[state.game].levels.map((l, i) =>
      `<button type="button" class="chip" data-level="${i}" aria-pressed="${i === current}"${l.aria ? ` aria-label="${l.aria}"` : ""}>${l.label}</button>`
    ).join("");
  }

  function newRound() {
    const game = GAMES[state.game];
    const level = game.levels[levelIndex(state.game)];
    let round;
    let guard = 0;
    do {
      round = game.make(level);
    } while (round.key === state.lastKey[state.game] && ++guard < 8);
    state.lastKey[state.game] = round.key;
    state.round = round;
    state.tries = 0;
    state.solved = false;

    els.question.innerHTML = round.question;
    els.visual.innerHTML = round.visual || "";
    els.choices.className = "choices" + (round.choiceClass ? ` ${round.choiceClass}` : "");
    els.choices.style.setProperty("--n", String(round.choices.length));
    els.choices.dataset.n = round.choices.length;
    els.choices.innerHTML = round.choices.map((c) =>
      `<button type="button" class="choice" data-value="${c.value}" aria-label="${c.label}">${c.html}</button>`
    ).join("");
    els.feedback.className = "feedback";
    els.feedback.innerHTML = "";
    els.next.hidden = true;
  }

  function selectGame(id, scroll) {
    state.game = id;
    store.set("game", id);
    els.tiles.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.game === id)));
    els.title.textContent = GAMES[id].title;
    renderLevels();
    newRound();
    if (scroll && els.board.getBoundingClientRect().top > window.innerHeight * .5) {
      els.board.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }

  function answer(btn) {
    const round = state.round;
    if (btn.dataset.value !== String(round.answer)) {
      state.tries++;
      state.streak = 0;
      btn.classList.add("wrong");
      btn.disabled = true;
      els.feedback.className = "feedback retry";
      els.feedback.innerHTML = `<strong class="praise">${pick(RETRY)}</strong> ${round.hint}`;
      els.streak.textContent = "";
      chime("wrong");
      return;
    }

    state.solved = true;
    btn.classList.add("right");
    els.choices.classList.add("done");
    [...els.choices.children].forEach((b) => { b.disabled = true; });

    // A star only for getting it first time, so tapping every button doesn't pay.
    const firstTry = state.tries === 0;
    let praise = firstTry ? pick(PRAISE) : "You got there!";
    let extra = "";
    if (firstTry) {
      state.stars++;
      state.streak++;
      store.set("stars", state.stars);
      showStars(true);
      if (state.stars % 10 === 0) {
        praise = `${state.stars} stars!`;
        extra = " You’re a real maths star.";
      }
    }
    els.feedback.className = "feedback good";
    els.feedback.innerHTML = `<strong class="praise">${praise}</strong> ${round.explain}${extra}`;
    els.streak.textContent = state.streak >= 3 ? `${state.streak} in a row!` : "";
    chime("right");
    burst(btn, firstTry && state.stars % 10 === 0);
    els.next.hidden = false;
    els.next.focus({ preventScroll: true });
  }

  els.tiles.forEach((tile) => tile.addEventListener("click", () => selectGame(tile.dataset.game, true)));

  els.levels.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.levels[state.game] = Number(chip.dataset.level);
    store.set("levels", state.levels);
    [...els.levels.children].forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    newRound();
  });

  els.choices.addEventListener("click", (e) => {
    const btn = e.target.closest(".choice");
    if (btn && !btn.disabled && !state.solved) answer(btn);
  });

  els.next.addEventListener("click", () => {
    newRound();
    const first = els.choices.querySelector(".choice");
    if (first) first.focus({ preventScroll: true });
  });

  if (canSpeak) els.speak.addEventListener("click", () => speak(state.round.say));
  else els.speak.hidden = true;

  els.sound.setAttribute("aria-pressed", String(state.sound));
  els.sound.addEventListener("click", () => {
    state.sound = !state.sound;
    store.set("sound", state.sound);
    els.sound.setAttribute("aria-pressed", String(state.sound));
  });

  els.reset.addEventListener("click", () => {
    if (!window.confirm("Set your stars back to zero?")) return;
    state.stars = 0;
    state.streak = 0;
    store.set("stars", 0);
    showStars(false);
    els.streak.textContent = "";
  });

  showStars(false);
  selectGame(state.game, false);
})();
