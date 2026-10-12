(function () {
  "use strict";

  const notes = Array.isArray(window.NOTE_ITEMS) ? window.NOTE_ITEMS : [];
  const stage = document.querySelector("[data-notes-stage]");
  if (!stage || !notes.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prevButton = document.querySelector("[data-notes-prev]");
  const nextButton = document.querySelector("[data-notes-next]");
  const dotsContainer = document.querySelector("[data-notes-dots]");
  const modal = document.querySelector("[data-note-modal]");

  let active = 0;

  const escapeHtml = (value) =>
    String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* ---------- 极简 markdown 渲染（支持标题/列表/代码块/表格/加粗/行内代码） ---------- */

  function inlineMd(text) {
    return escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function renderMarkdown(source) {
    const lines = String(source || "").replace(/\r/g, "").split("\n");
    const html = [];
    let i = 0;

    const closeLists = (stack, to) => {
      while (stack.length > to) {
        html.push(stack.pop() === "ol" ? "</ol>" : "</ul>");
      }
    };

    while (i < lines.length) {
      const line = lines[i];

      if (/^\s*```/.test(line)) {
        const buf = [];
        i += 1;
        while (i < lines.length && !/^\s*```/.test(lines[i])) {
          buf.push(lines[i]);
          i += 1;
        }
        i += 1;
        html.push("<pre><code>" + escapeHtml(buf.join("\n")) + "</code></pre>");
        continue;
      }

      if (/^\s*\|.*\|\s*$/.test(line)) {
        const rows = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
          rows.push(lines[i]);
          i += 1;
        }
        const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        const isDivider = (row) => /^[\s|:-]+$/.test(row);
        let table = "<table>";
        rows.forEach((row, idx) => {
          if (isDivider(row)) return;
          const tag = idx === 0 ? "th" : "td";
          table += "<tr>" + cells(row).map((c) => `<${tag}>${inlineMd(c)}</${tag}>`).join("") + "</tr>";
        });
        html.push(table + "</table>");
        continue;
      }

      const heading = line.match(/^\s*(#{1,4})\s+(.*)$/);
      if (heading) {
        const level = heading[1].length;
        html.push(`<h${level}>${inlineMd(heading[2])}</h${level}>`);
        i += 1;
        continue;
      }

      if (/^\s*(\*{4,}|-{3,})\s*$/.test(line)) {
        html.push("<hr>");
        i += 1;
        continue;
      }

      const item = line.match(/^(\s*)(?:[*\-]|(\d+)\.)\s+(.*)$/);
      if (item) {
        const depth = Math.floor(item[1].replace(/\t/g, "  ").length / 2);
        const type = item[2] ? "ol" : "ul";
        const stack = [];
        while (i < lines.length) {
          const m = lines[i].match(/^(\s*)(?:[*\-]|(\d+)\.)\s+(.*)$/);
          if (!m) break;
          const d = Math.floor(m[1].replace(/\t/g, "  ").length / 2);
          const t = m[2] ? "ol" : "ul";
          if (d > stack.length - 1) {
            stack.push(t);
            html.push(`<${t}>`);
          } else {
            closeLists(stack, d + 1);
            if (stack[stack.length - 1] !== t) {
              html.push(stack.pop() === "ol" ? "</ol>" : "</ul>");
              stack.push(t);
              html.push(`<${t}>`);
            }
          }
          html.push("<li>" + inlineMd(m[3]) + "</li>");
          i += 1;
        }
        closeLists(stack, 0);
        continue;
      }

      if (line.trim() === "") {
        i += 1;
        continue;
      }

      html.push("<p>" + inlineMd(line.trim()) + "</p>");
      i += 1;
    }

    return html.join("\n");
  }

  /* ---------- 扇形卡片布局 ---------- */

  const cards = notes.map((note, index) => {
    const card = document.createElement("article");
    card.className = "note-card";
    card.dataset.index = String(index);
    card.innerHTML = `
      <div class="note-card-cover">
        <span class="note-card-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="note-card-hint">阅读全文 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></span>
      </div>
      <div class="note-card-body">
        <p class="note-card-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>${escapeHtml(note.meta || "")}</p>
        <h3>${escapeHtml(note.title || "")}</h3>
        <p>${escapeHtml(note.description || "")}</p>
        <ul class="tag-list">${(note.tags || []).map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>
        <div class="note-card-footer"><span>查看笔记</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
      </div>
    `;
    stage.appendChild(card);
    return card;
  });

  const dots = notes.map((note, index) => {
    const dot = document.createElement("button");
    dot.className = "notes-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `查看笔记：${note.title || index + 1}`);
    dot.addEventListener("click", () => goTo(index));
    dotsContainer.appendChild(dot);
    return dot;
  });

  function spacing() {
    return Math.min(stage.clientWidth * 0.26, 220);
  }

  function layout() {
    const gap = spacing();
    cards.forEach((card, index) => {
      const offset = index - active;
      const abs = Math.abs(offset);
      const hidden = abs > 3;
      card.style.setProperty("--tx", `${offset * gap}px`);
      card.style.setProperty("--ry", `${Math.max(-42, Math.min(42, -offset * 26))}deg`);
      card.style.setProperty("--sc", String(Math.max(0.68, 1 - abs * 0.11)));
      card.style.setProperty("--br", String(Math.max(0.72, 1 - abs * 0.1)));
      card.style.setProperty("--op", hidden ? "0" : String(1 - abs * 0.12));
      card.style.zIndex = String(100 - abs);
      card.classList.toggle("is-center", offset === 0);
      card.classList.toggle("is-hidden-card", hidden);
      card.setAttribute("aria-hidden", String(offset !== 0));
    });
    dots.forEach((dot, index) => dot.classList.toggle("is-active", index === active));
  }

  function goTo(index) {
    active = (index + notes.length) % notes.length;
    layout();
  }

  prevButton.addEventListener("click", () => goTo(active - 1));
  nextButton.addEventListener("click", () => goTo(active + 1));

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      if (index === active) {
        openNote(notes[index]);
      } else {
        goTo(index);
      }
    });
  });

  stage.tabIndex = 0;
  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(active - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(active + 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      openNote(notes[active]);
    }
  });

  /* 触摸滑动 */
  let touchX = null;
  stage.addEventListener("pointerdown", (event) => {
    touchX = event.clientX;
  });
  stage.addEventListener("pointerup", (event) => {
    if (touchX === null) return;
    const delta = event.clientX - touchX;
    touchX = null;
    if (Math.abs(delta) > 40) goTo(active + (delta < 0 ? 1 : -1));
  });

  window.addEventListener("resize", layout);

  /* ---------- 阅读弹层 ---------- */

  function openNote(note) {
    if (!modal) return;
    modal.querySelector("[data-note-title]").textContent = note.title || "";
    modal.querySelector("[data-note-meta]").textContent = note.meta || "";
    modal.querySelector("[data-note-content]").innerHTML = renderMarkdown(note.markdown);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const closeButton = modal.querySelector(".note-close");
    if (closeButton) closeButton.focus();
  }

  function closeNote() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  if (modal) {
    modal.querySelectorAll("[data-note-close]").forEach((element) => {
      element.addEventListener("click", closeNote);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeNote();
    });
  }

  layout();
})();
