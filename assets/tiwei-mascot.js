(function () {
  "use strict";

  const mountMascot = () => {
    if (document.querySelector(".tiwei-mascot")) return;

    const host = document.createElement("div");
    host.className = "tiwei-mascot";
    host.innerHTML = `
      <button class="tiwei-mascot__button" type="button" aria-label="田曦薇照片形象">
        <span class="tiwei-mascot__sticker">
          <span class="tiwei-mascot__sticker-aura" aria-hidden="true"></span>
          <span class="tiwei-mascot__photo-frame">
            <img class="tiwei-mascot__photo" src="./assets/tian-xiwei-portrait.png" alt="" draggable="false">
          </span>
        </span>
      </button>
    `;

    document.body.appendChild(host);

    const button = host.querySelector(".tiwei-mascot__button");
    const motionClasses = ["is-tapped", "is-scrolling-up", "is-scrolling-down"];
    let resetTimer = 0;
    let lastWheelAt = 0;

    const playMotion = (className, duration) => {
      window.clearTimeout(resetTimer);
      host.classList.remove(...motionClasses);

      // Restart the same CSS animation when the user interacts repeatedly.
      void host.offsetWidth;
      host.classList.add(className);

      resetTimer = window.setTimeout(() => {
        host.classList.remove(className);
      }, duration);
    };

    button.addEventListener("click", () => {
      playMotion("is-tapped", 680);
    });

    window.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaY) < 1) return;

      const now = performance.now();
      if (now - lastWheelAt < 190) return;
      lastWheelAt = now;

      playMotion(event.deltaY < 0 ? "is-scrolling-up" : "is-scrolling-down", 640);
    }, { passive: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountMascot, { once: true });
  } else {
    mountMascot();
  }
})();