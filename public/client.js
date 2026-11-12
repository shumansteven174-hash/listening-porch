// Client-side bits for The Listening Porch.
// Guided box breathing (4 in, 4 hold, 4 out, 4 hold). Runs entirely in the browser.

(function () {
  const startBtn = document.getElementById("breath-start");
  const stopBtn = document.getElementById("breath-stop");
  const circle = document.getElementById("breath-circle");
  const label = document.getElementById("breath-label");
  if (!startBtn || !circle) return;

  let timer = null;
  let phase = 0; // 0 in, 1 hold, 2 out, 3 hold
  const phases = [
    { text: "Breathe in…", cls: "in" },
    { text: "Hold…", cls: "in" },
    { text: "Breathe out…", cls: "out" },
    { text: "Hold…", cls: "out" },
  ];

  function step() {
    const p = phases[phase % 4];
    label.textContent = p.text;
    circle.classList.remove("in", "out");
    circle.classList.add(p.cls);
    phase += 1;
  }

  startBtn.addEventListener("click", () => {
    if (timer) return;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    step();
    timer = setInterval(step, 4000);
  });

  stopBtn.addEventListener("click", () => {
    clearInterval(timer);
    timer = null;
    phase = 0;
    label.textContent = "Ready?";
    circle.classList.remove("in", "out");
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
})();
