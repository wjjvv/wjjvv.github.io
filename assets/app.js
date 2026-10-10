(function () {
  "use strict";

  const site = window.PERSONAL_SITE || {};
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const getValue = (path, fallback) => {
    const value = path.split(".").reduce((result, key) => {
      if (result && Object.prototype.hasOwnProperty.call(result, key)) {
        return result[key];
      }
      return undefined;
    }, site);
    return value === undefined || value === null ? fallback : value;
  };

  const escapeHtml = (value) => {
    const element = document.createElement("div");
    element.textContent = String(value);
    return element.innerHTML;
  };

  const safeUrl = (value) => {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:", "mailto:"].includes(url.protocol) ? value : "";
    } catch (error) {
      return "";
    }
  };

  const safeAssetUrl = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized || /^(?:javascript|data|vbscript):/i.test(normalized)) return "";
    return normalized;
  };
  const setMeta = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value) element.setAttribute("content", value);
  };

  function applyContent() {
    document.querySelectorAll("[data-content]").forEach((element) => {
      const value = getValue(element.dataset.content);
      if (value === undefined || value === null || value === "") return;

      element.textContent = value;
    });

    const aboutCopy = document.querySelector("[data-about-copy]");
    const aboutParagraphs = getValue("about.paragraphs", []);
    if (aboutCopy && Array.isArray(aboutParagraphs) && aboutParagraphs.length) {
      aboutCopy.replaceChildren();
      aboutParagraphs.forEach((paragraph) => {
        const element = document.createElement("p");
        element.textContent = paragraph;
        aboutCopy.appendChild(element);
      });
    }
  }

  function renderProjects() {
    const container = document.querySelector("[data-projects]");
    const projects = getValue("work.projects", []);
    if (!container || !Array.isArray(projects)) return;

    container.innerHTML = projects.map((project, index) => {
      const tags = Array.isArray(project.tags) ? project.tags : [];
      const link = safeUrl(project.link);
      const cover = safeAssetUrl(project.cover);
      const source = String(project.source || "").trim();
      const linkMarkup = link
        ? `<a class="project-link" href="${escapeHtml(link)}"${/^https?:/i.test(link) ? ' target="_blank" rel="noreferrer"' : ""}><span>查看项目</span><span aria-hidden="true">↗</span></a>`
        : "";
      const sourceMarkup = source
        ? `<button class="project-link project-source-trigger" type="button" data-source="${escapeHtml(source)}"><span>查看源代码</span><span aria-hidden="true">↗</span></button>`
        : "";
      const coverMarkup = cover
        ? `<figure class="project-cover"><img src="${escapeHtml(cover)}" alt="${escapeHtml(project.title || "项目")}封面" loading="lazy"></figure>`
        : "";

      return `
        <article class="project-card${cover ? " has-cover" : ""}${source ? " has-source" : ""}" data-reveal${source ? ` data-source="${escapeHtml(source)}" tabindex="0" role="button" aria-label="查看源代码：${escapeHtml(project.title || "项目")}"` : ""}>
          ${coverMarkup}
          <div class="project-body">
            <div class="project-top">
              <span class="project-number">${String(index + 1).padStart(2, "0")}</span>
              <span class="project-meta">${escapeHtml(project.meta || "")}</span>
            </div>
            <h3>${escapeHtml(project.title || "")}</h3>
            <p>${escapeHtml(project.description || "")}</p>
            <ul class="tag-list">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>
            ${linkMarkup}
            ${sourceMarkup}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderExperience() {
    const container = document.querySelector("[data-experience]");
    const items = getValue("experience.items", []);
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = items.map((item) => `
      <article class="timeline-item">
        <span class="timeline-period">${escapeHtml(item.period || "")}</span>
        <div class="timeline-title">
          <h3>${escapeHtml(item.title || "")}</h3>
          <p>${escapeHtml(item.organization || "")}</p>
        </div>
        <p class="timeline-description">${escapeHtml(item.description || "")}</p>
      </article>
    `).join("");
  }

  const socialIconMarkup = {
    github: `
      <svg class="social-logo-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z"></path>
      </svg>`,
    wechat: `
      <svg class="social-logo-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8.7 2.2C3.9 2.2 0 5.5 0 9.5c0 2.2 1.2 4.2 3 5.6.1.1.2.3.2.5l-.4 1.5c-.1.2 0 .4.2.5.1.1.2 0 .3 0l1.9-1.1c.1-.1.3-.1.4-.1 1.2.4 2.5.6 3.8.5-.6-1.4-.8-2.9-.6-4.3.5-3.7 4-6.4 8-6.1.2-2.3-3.3-4.3-8.1-4.3Zm-2 4.4c.7 0 1.2.5 1.2 1.2S7.4 9 6.7 9 5.5 8.5 5.5 7.8s.5-1.2 1.2-1.2Zm6.4 0c.7 0 1.2.5 1.2 1.2S13.8 9 13.1 9s-1.2-.5-1.2-1.2.5-1.2 1.2-1.2Z"></path>
        <path d="M15.9 8.9c-4.2 0-7.6 2.8-7.6 6.2s3.4 6.2 7.6 6.2c.7 0 1.4-.1 2.1-.2l1.5.9c.1.1.3.1.4 0 .1-.1.2-.2.1-.4l-.3-1.2c1.7-1.1 2.7-2.9 2.7-5.3 0-3.4-3.4-6.2-7.6-6.2Zm-2.4 3.7c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1Zm4.9 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1Z"></path>
      </svg>`
  };

  function getSocialIcon(social) {
    const icon = String(social.icon || "").toLowerCase();
    const label = String(social.label || "").toLowerCase();
    if (icon === "github" || label.includes("github")) return "github";
    if (icon === "wechat" || label.includes("微信")) return "wechat";
    return "";
  }

  function appendSocialContent(element, social, text) {
    const icon = getSocialIcon(social);
    if (icon) {
      const logo = document.createElement("span");
      logo.className = `social-logo social-logo-${icon}`;
      logo.setAttribute("aria-hidden", "true");
      logo.insertAdjacentHTML("afterbegin", socialIconMarkup[icon]);
      element.appendChild(logo);
    }

    const label = document.createElement("span");
    label.className = "social-label";
    label.textContent = text;
    element.appendChild(label);
  }

  function renderSocials() {
    const containers = document.querySelectorAll("[data-socials]");
    const socials = getValue("socials", []);
    if (!containers.length || !Array.isArray(socials)) return;

    containers.forEach((container) => {
      container.replaceChildren();
      socials.forEach((social) => {
        if (social.copy) {
          const button = document.createElement("button");
          button.className = "social-link social-link-button";
          button.type = "button";
          appendSocialContent(button, social, social.text || social.label || social.copy);
          button.dataset.copyValue = social.copy;
          button.dataset.copyName = social.copyName || social.label || "内容";
          button.dataset.copyPreserve = "true";
          container.appendChild(button);
          return;
        }

        const href = safeUrl(social.href);
        if (!href) return;
        const link = document.createElement("a");
        link.className = "social-link";
        link.href = href;
        appendSocialContent(link, social, social.text || social.label || href.replace(/^mailto:/, ""));
        if (/^https?:/i.test(href)) {
          link.target = "_blank";
          link.rel = "noreferrer";
        }
        container.appendChild(link);
      });
      container.hidden = !container.children.length;
    });
  }

  function applyDocumentMeta() {
    const name = getValue("name", "个人主页");
    const role = getValue("role", "个人主页");
    const defaultTitle = `${name}｜${role.split("/")[0].trim()}`;
    const pageTitle = document.body.dataset.pageTitle || defaultTitle;
    const description = document.body.dataset.pageDescription || getValue("hero.intro", "");

    document.title = pageTitle;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', pageTitle);
    setMeta('meta[property="og:description"]', description);
  }

  function applyEmail() {
    const email = getValue("email", "");
    if (!email) return;

    document.querySelectorAll("[data-email-link]").forEach((link) => {
      link.href = `mailto:${email}`;
    });

    document.querySelectorAll("[data-email-text]").forEach((element) => {
      element.textContent = email;
    });
  }

  function setupThemeToggle() {
    const toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) return;

    const updateLabel = () => {
      const isDark = root.dataset.theme === "dark";
      toggle.setAttribute("aria-label", isDark ? "切换浅色模式" : "切换深色模式");
      toggle.setAttribute("aria-pressed", String(isDark));
    };

    updateLabel();
    toggle.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = nextTheme;
      try {
        localStorage.setItem("personal-site-theme", nextTheme);
      } catch (error) {
        // 无痕模式或本地文件限制下，主题仍可在当前页面切换。
      }
      updateLabel();
    });
  }

  function setupHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;

    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 18);
    update();
    window.addEventListener("scroll", update, { passive: true });

    const links = Array.from(document.querySelectorAll(".site-nav a"));
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });

    sections.forEach((section) => observer.observe(section));
  }

  function setupReveal() {
    const elements = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!elements.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    elements.forEach((element) => observer.observe(element));
  }

  function setupCopyButtons() {
    const buttons = Array.from(document.querySelectorAll("[data-copy-email], [data-copy-value]"));
    const toast = document.querySelector("[data-toast]");
    const email = getValue("email", "");
    if (!buttons.length) return;

    const showToast = (label) => {
      if (!toast) return;
      toast.textContent = `${label}已复制`;
      toast.classList.add("is-visible");
      window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
    };

    const fallbackCopy = (value) => {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    };

    buttons.forEach((button) => {
      const value = button.dataset.copyValue || email;
      if (!value) return;

      const originalText = button.dataset.copyLabel || button.textContent.trim();
      const preserveContent = button.dataset.copyPreserve === "true";
      const copyName = button.dataset.copyName || button.dataset.copyLabel || "邮箱";

      button.addEventListener("click", async () => {
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
          } else {
            fallbackCopy(value);
          }
          if (!preserveContent) button.textContent = "已复制";
          showToast(copyName);
          if (!preserveContent) {
            window.setTimeout(() => { button.textContent = originalText; }, 1800);
          }
        } catch (error) {
          fallbackCopy(value);
          if (!preserveContent) button.textContent = "已复制";
          showToast(copyName);
          if (!preserveContent) {
            window.setTimeout(() => { button.textContent = originalText; }, 1800);
          }
        }
      });
    });
  }

  function setupSourceModal() {
    const modal = document.querySelector("[data-source-modal]");
    if (!modal) return;

    let currentCode = "";

    const fallbackCopy = (value) => {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    };

    const open = (sourceId) => {
      const sources = window.PROJECT_SOURCES || {};
      const code = typeof sources[sourceId] === "string" ? sources[sourceId] : "";
      if (!code) return;

      const projects = getValue("work.projects", []);
      const project = projects.find((item) => String(item.source || "").trim() === sourceId) || {};

      modal.querySelector("[data-source-title]").textContent = project.title
        ? `${project.title} · 源代码`
        : "源代码";
      modal.querySelector("[data-source-meta]").textContent = project.meta || "";
      modal.querySelector("[data-source-lang]").textContent =
        (project.tags && project.tags[0]) || "Python";

      const codeElement = modal.querySelector("[data-source-code]");
      codeElement.replaceChildren();
      const lines = code.replace(/\r/g, "").replace(/\n+$/, "").split("\n");
      lines.forEach((line, index) => {
        const row = document.createElement("span");
        row.className = "source-line";
        const number = document.createElement("span");
        number.className = "source-line-num";
        number.setAttribute("aria-hidden", "true");
        number.textContent = String(index + 1);
        const text = document.createElement("span");
        text.className = "source-line-text";
        text.textContent = line || " ";
        row.append(number, text);
        codeElement.appendChild(row);
      });

      currentCode = code;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      const closeButton = modal.querySelector(".source-close");
      if (closeButton) closeButton.focus();
    };

    const close = () => {
      modal.hidden = true;
      currentCode = "";
      document.body.style.overflow = "";
    };

    modal.querySelectorAll("[data-source-close]").forEach((element) => {
      element.addEventListener("click", close);
    });

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-source]");
      if (trigger) open(trigger.dataset.source);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) close();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const trigger = event.target.closest("[data-source]");
      if (!trigger || trigger.tagName === "BUTTON") return;
      event.preventDefault();
      open(trigger.dataset.source);
    });

    const copyButton = modal.querySelector("[data-source-copy]");
    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        if (!currentCode) return;
        const originalText = copyButton.textContent;
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(currentCode);
          } else {
            fallbackCopy(currentCode);
          }
        } catch (error) {
          fallbackCopy(currentCode);
        }
        copyButton.textContent = "已复制";
        window.setTimeout(() => { copyButton.textContent = originalText; }, 1600);
      });
    }
  }
  function setCurrentYear() {
    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
  }

  applyContent();
  applyDocumentMeta();
  renderProjects();
  renderExperience();
  renderSocials();
  applyEmail();
  setupThemeToggle();
  setupHeader();
  setupReveal();
  setupCopyButtons();
  setupSourceModal();
  setCurrentYear();
})();
