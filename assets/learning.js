(function () {
  "use strict";

  const site = window.PERSONAL_SITE || {};
  const form = document.querySelector("[data-learning-form]");
  if (!form) return;

  const DB_NAME = "daily-learning-log";
  const DB_VERSION = 1;
  const FALLBACK_KEY = "daily-learning-records-v1";
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const DEFAULT_STATUS = "记录只保存在当前浏览器中。";

  const recordList = document.querySelector("[data-record-list]");
  const searchInput = document.querySelector("[data-record-search]");
  const categoryFilter = document.querySelector("[data-record-category]");
  const recordSummary = document.querySelector("[data-record-summary]");
  const archiveStatusFilter = document.querySelector("[data-record-status]");
  const archiveAllButton = document.querySelector("[data-archive-all]");
  const fileInput = document.querySelector("[data-learning-files]");
  const selectedFiles = document.querySelector("[data-selected-files]");
  const editingFiles = document.querySelector("[data-editing-files]");
  const statusElement = document.querySelector("[data-form-status]");
  const submitButton = document.querySelector("[data-submit-record]");
  const cancelButton = document.querySelector("[data-cancel-edit]");
  const ownerAccess = document.querySelector("[data-owner-access]");
  const ownerLoginForm = document.querySelector("[data-owner-login-form]");
  const ownerCodeInput = document.querySelector("[data-owner-code]");
  const ownerLogoutButton = document.querySelector("[data-owner-logout]");
  const accessTitle = document.querySelector("[data-access-title]");
  const accessDescription = document.querySelector("[data-access-description]");
  const adminCode = String((site.learning && site.learning.adminCode) || "");
  const OWNER_SESSION_KEY = "daily-learning-owner-session";

  const state = {
    records: [],
    attachmentsByRecord: new Map(),
    editingId: null,
    editingAttachments: [],
    pendingDeletes: new Set(),
    db: null,
    dbPromise: null,
    dbReady: false,
    objectUrls: [],
    ownerUnlocked: false
  };

  function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = String(value == null ? "" : value);
    return element.innerHTML;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getToday() {
    return formatLocalDate(new Date());
  }

  function parseLocalDate(value) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatMinutes(minutes) {
    const safeMinutes = Math.max(0, Number(minutes) || 0);
    if (safeMinutes < 60) return `${safeMinutes}m`;
    const hours = safeMinutes / 60;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
  }

  function setStatus(message, type) {
    if (!statusElement) return;
    statusElement.textContent = message || DEFAULT_STATUS;
    statusElement.classList.toggle("is-success", type === "success");
    statusElement.classList.toggle("is-error", type === "error");
  }

  function setFormBusy(isBusy) {
    form.setAttribute("aria-busy", String(isBusy));
    submitButton.disabled = isBusy || !state.ownerUnlocked;
    cancelButton.disabled = isBusy || !state.ownerUnlocked;
    if (isBusy) {
      submitButton.textContent = "正在保存…";
    } else if (state.editingId) {
      submitButton.innerHTML = '更新这条记录 <span aria-hidden="true">↗</span>';
    } else {
      submitButton.innerHTML = '保存今日记录 <span aria-hidden="true">↗</span>';
    }
  }

  function readOwnerSession() {
    try {
      return sessionStorage.getItem(OWNER_SESSION_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function writeOwnerSession(unlocked) {
    try {
      if (unlocked) {
        sessionStorage.setItem(OWNER_SESSION_KEY, "1");
      } else {
        sessionStorage.removeItem(OWNER_SESSION_KEY);
      }
    } catch (error) {
      // 无痕模式下仅当前页面有效。
    }
  }

  function applyPermissions(message, type) {
    const unlocked = state.ownerUnlocked;

    if (ownerAccess) ownerAccess.classList.toggle("is-owner", unlocked);
    if (ownerLoginForm) ownerLoginForm.hidden = unlocked;
    if (ownerLogoutButton) ownerLogoutButton.hidden = !unlocked;
    if (accessTitle) accessTitle.textContent = unlocked ? "本人管理模式" : "访客只读";
    if (accessDescription) {
      accessDescription.textContent = unlocked
        ? "你可以增加、编辑、归档和删除学习记录。"
        : "他人只能查看学习记录，无法增加、编辑或删除。";
    }

    form.classList.toggle("is-read-only", !unlocked);
    form.querySelectorAll("input, select, textarea, button").forEach((control) => {
      control.disabled = !unlocked;
    });

    if (archiveAllButton) archiveAllButton.hidden = !unlocked;
    if (!unlocked) cancelButton.hidden = true;
    if (ownerCodeInput) ownerCodeInput.value = "";

    if (message) {
      setStatus(message, type || "");
    } else if (unlocked) {
      setStatus("本人管理模式已开启。", "success");
    } else {
      setStatus("当前为访客只读模式，只有本人登录后才能修改。", "");
    }

    renderRecords();
  }

  function handleOwnerLogin(event) {
    event.preventDefault();
    if (state.ownerUnlocked) return;

    if (!adminCode) {
      setStatus("尚未配置本人管理口令，请先修改 content.js。", "error");
      return;
    }

    if (!ownerCodeInput || ownerCodeInput.value !== adminCode) {
      setStatus("管理口令不正确。", "error");
      if (ownerCodeInput) ownerCodeInput.select();
      return;
    }

    state.ownerUnlocked = true;
    writeOwnerSession(true);
    applyPermissions("已进入本人管理模式。", "success");
  }

  function handleOwnerLogout() {
    state.ownerUnlocked = false;
    writeOwnerSession(false);
    resetEditor();
    applyPermissions("已退出管理模式，当前为访客只读。", "");
  }
  function openDatabase() {
    if (!("indexedDB" in window)) {
      return Promise.reject(new Error("IndexedDB is not supported"));
    }
    if (state.db) return Promise.resolve(state.db);
    if (state.dbPromise) return state.dbPromise;

    state.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("records")) {
          const records = database.createObjectStore("records", { keyPath: "id" });
          records.createIndex("date", "date", { unique: false });
        }
        if (!database.objectStoreNames.contains("attachments")) {
          const attachments = database.createObjectStore("attachments", { keyPath: "id" });
          attachments.createIndex("recordId", "recordId", { unique: false });
        }
      };

      request.onsuccess = () => {
        state.db = request.result;
        state.db.onversionchange = () => state.db.close();
        resolve(state.db);
      };

      request.onerror = () => reject(request.error || new Error("Unable to open database"));
    });

    return state.dbPromise;
  }

  function transactionComplete(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Database transaction failed"));
      transaction.onabort = () => reject(transaction.error || new Error("Database transaction was aborted"));
    });
  }

  async function dbGetAll(storeName) {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error("Unable to read database"));
    });
  }

  async function dbPut(storeName, value) {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    await transactionComplete(transaction);
  }

  async function dbDelete(storeName, id) {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    await transactionComplete(transaction);
  }

  async function dbClear(storeName) {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).clear();
    await transactionComplete(transaction);
  }

  function readFallbackRecords() {
    try {
      const value = JSON.parse(localStorage.getItem(FALLBACK_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function writeFallbackRecords(records) {
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(records));
    } catch (error) {
      throw new Error("浏览器本地存储空间不足");
    }
  }

  async function loadStoredData() {
    if (state.dbReady) {
      state.records = await dbGetAll("records");
      const attachments = await dbGetAll("attachments");
      state.attachmentsByRecord = new Map();
      attachments.forEach((attachment) => {
        const list = state.attachmentsByRecord.get(attachment.recordId) || [];
        list.push(attachment);
        state.attachmentsByRecord.set(attachment.recordId, list);
      });
      return;
    }

    state.records = readFallbackRecords();
    state.attachmentsByRecord = new Map();
  }

  async function saveRecord(record) {
    if (state.dbReady) {
      await dbPut("records", record);
      return;
    }

    const records = state.records.filter((item) => item.id !== record.id);
    records.push(record);
    writeFallbackRecords(records);
  }

  async function removeRecord(record) {
    if (state.dbReady) {
      await dbDelete("records", record.id);
      return;
    }
    writeFallbackRecords(state.records.filter((item) => item.id !== record.id));
  }

  async function saveAttachment(file, recordId) {
    const attachment = {
      id: createId(),
      recordId,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      blob: file,
      createdAt: new Date().toISOString()
    };
    await dbPut("attachments", attachment);
    return attachment;
  }

  async function removeAttachment(attachmentId) {
    if (state.dbReady) await dbDelete("attachments", attachmentId);
  }

  function calculateStreak(records) {
    const source = Array.isArray(records) ? records : state.records;
    const recordedDates = new Set(source.map((record) => record.date).filter(Boolean));
    const cursor = new Date(`${getToday()}T00:00:00`);
    if (!recordedDates.has(formatLocalDate(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (recordedDates.has(formatLocalDate(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function renderStats() {
    const activeRecords = state.records.filter((record) => !record.archived);
    const totalMinutes = activeRecords.reduce((total, record) => total + (Number(record.minutes) || 0), 0);
    const stats = [
      ["[data-stat-records]", activeRecords.length],
      ["[data-stat-streak]", calculateStreak(activeRecords)],
      ["[data-stat-minutes]", formatMinutes(totalMinutes)]
    ];

    stats.forEach(([selector, value]) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = String(value);
    });
  }

  function populateCategoryFilter() {
    const current = categoryFilter.value;
    const categories = Array.from(form.elements.category.options).map((option) => option.value);
    categoryFilter.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "全部分类";
    categoryFilter.appendChild(allOption);

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });

    if (categories.includes(current)) categoryFilter.value = current;
  }

  function getFilteredRecords() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const archiveStatus = archiveStatusFilter ? archiveStatusFilter.value : "active";

    return state.records
      .filter((record) => {
        const matchesCategory = category === "all" || record.category === category;
        const isArchived = Boolean(record.archived);
        const matchesArchiveStatus = archiveStatus === "all"
          || (archiveStatus === "archived" && isArchived)
          || (archiveStatus === "active" && !isArchived);
        if (!matchesCategory || !matchesArchiveStatus) return false;
        if (!query) return true;
        const haystack = [
          record.topic,
          record.summary,
          record.challenge,
          record.nextStep,
          record.category
        ].join(" ").toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => {
        const dateComparison = String(b.date || "").localeCompare(String(a.date || ""));
        if (dateComparison !== 0) return dateComparison;
        return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
      });
  }

  function getDateParts(value) {
    const date = parseLocalDate(value);
    if (!date) {
      return { day: "--", label: value || "日期未知" };
    }
    const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date);
    const year = date.getFullYear() === new Date().getFullYear() ? "" : `${date.getFullYear()}年`;
    return {
      day: String(date.getDate()).padStart(2, "0"),
      label: `${year}${date.getMonth() + 1}月 · ${weekday}`
    };
  }

  function getFileExtension(name) {
    const parts = String(name || "").split(".");
    return parts.length > 1 ? parts.pop().slice(0, 4).toUpperCase() : "FILE";
  }

  function renderAttachment(attachment) {
    const isImage = String(attachment.type || "").startsWith("image/");
    const objectUrl = URL.createObjectURL(attachment.blob);
    state.objectUrls.push(objectUrl);
    const preview = isImage
      ? `<img src="${objectUrl}" alt="">`
      : `<span>${escapeHtml(getFileExtension(attachment.name))}</span>`;

    return `
      <a class="record-attachment" href="${objectUrl}" download="${escapeHtml(attachment.name)}">
        <span class="attachment-preview">${preview}</span>
        <span class="attachment-info">
          <strong>${escapeHtml(attachment.name)}</strong>
          <small>${escapeHtml(formatFileSize(attachment.size))}</small>
        </span>
      </a>
    `;
  }

  function renderRecord(record) {
    const date = getDateParts(record.date);
    const isArchived = Boolean(record.archived);
    const attachments = state.attachmentsByRecord.get(record.id) || [];
    const attachmentMarkup = attachments.length
      ? `<div class="record-attachments">${attachments.map(renderAttachment).join("")}</div>`
      : "";

    const details = [
      record.challenge
        ? `<div class="record-detail"><span>遇到的问题</span><p>${escapeHtml(record.challenge)}</p></div>`
        : "",
      record.nextStep
        ? `<div class="record-detail"><span>明日计划</span><p>${escapeHtml(record.nextStep)}</p></div>`
        : ""
    ].join("");

    const archiveActionMarkup = isArchived
      ? `<button class="icon-action is-restore" type="button" data-action="restore" data-record-id="${escapeHtml(record.id)}" aria-label="恢复这条记录" title="恢复">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.7"></path><path d="M4 4v5h5"></path></svg>
        </button>
        <button class="icon-action is-danger" type="button" data-action="delete-permanent" data-record-id="${escapeHtml(record.id)}" aria-label="永久删除这条记录" title="永久删除">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path></svg>
        </button>`
      : `<button class="icon-action is-archive" type="button" data-action="archive" data-record-id="${escapeHtml(record.id)}" aria-label="归档这条记录" title="归档">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v13H4zM9 4h6v3M9 13h6"></path></svg>
        </button>`;

    const managementActions = state.ownerUnlocked
      ? `<button class="icon-action" type="button" data-action="edit" data-record-id="${escapeHtml(record.id)}" aria-label="编辑这条记录" title="编辑">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.2-1 10.2-10.2a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z"></path><path d="m13.8 7.4 3 3"></path></svg>
        </button>
        ${archiveActionMarkup}`
      : `<span class="record-read-only">只读</span>`;

    return `
      <article class="record-card${isArchived ? " is-archived" : ""}">
        <div class="record-date-rail">
          <div class="record-date-main">
            <strong>${escapeHtml(date.day)}</strong>
            <span>${escapeHtml(date.label)}</span>
          </div>
          <span class="record-duration"><b>${escapeHtml(record.minutes)}</b> 分钟</span>
        </div>
        <div class="record-body">
          <div class="record-card-head">
            <div>
              <div class="record-meta">
                <span class="record-category">${escapeHtml(record.category || "其他")}</span>
                <span class="record-mood">${escapeHtml(record.mood || "已记录")}</span>
                ${isArchived ? `<span class="record-archived">已归档</span>` : ""}
              </div>
              <h3>${escapeHtml(record.topic)}</h3>
            </div>
            <div class="record-card-actions">
              ${managementActions}
            </div>
          </div>
          <p class="record-summary-text">${escapeHtml(record.summary)}</p>
          ${details ? `<div class="record-details">${details}</div>` : ""}
          ${attachmentMarkup}
        </div>
      </article>
    `;
  }

  function renderRecords() {
    state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    state.objectUrls = [];

    const records = getFilteredRecords();
    const activeCount = state.records.filter((record) => !record.archived).length;
    const archivedCount = state.records.length - activeCount;
    const archiveStatus = archiveStatusFilter ? archiveStatusFilter.value : "active";
    if (archiveAllButton) archiveAllButton.disabled = activeCount === 0;

    const scopeSummary = `当前 ${activeCount} 条，已归档 ${archivedCount} 条。`;
    if (records.length) {
      recordSummary.textContent = `显示 ${records.length} 条记录；${scopeSummary}`;
    } else if (state.records.length) {
      recordSummary.textContent = `没有匹配的学习记录；${scopeSummary}`;
    } else {
      recordSummary.textContent = "还没有学习记录。";
    }

    if (!records.length) {
      const isArchiveViewEmpty = archiveStatus === "archived" && archivedCount === 0;
      const isActiveViewEmpty = archiveStatus === "active" && activeCount === 0 && archivedCount > 0;
      const emptyTitle = !state.records.length
        ? "从今天的第一次记录开始"
        : isArchiveViewEmpty
          ? "还没有归档记录"
          : isActiveViewEmpty
            ? "当前没有记录"
            : "没有找到匹配记录";
      const emptyText = !state.records.length
        ? "填写上方表单后，你的学习足迹会出现在这里。"
        : isArchiveViewEmpty
          ? "归档后的记录会安全地保存在这里。"
          : isActiveViewEmpty
            ? `已有 ${archivedCount} 条归档记录，可在“已归档”中查看和恢复。`
            : "换一个关键词、分类或归档状态再试试。";

      recordList.innerHTML = `
        <div class="record-empty">
          <span aria-hidden="true">${state.records.length ? "⌕" : "✦"}</span>
          <h3>${emptyTitle}</h3>
          <p>${emptyText}</p>
        </div>
      `;
      return;
    }

    recordList.innerHTML = records.map(renderRecord).join("");
  }

  function renderSelectedFiles() {
    const files = Array.from(fileInput.files || []);
    selectedFiles.replaceChildren();
    selectedFiles.hidden = files.length === 0;
    files.forEach((file) => {
      const chip = document.createElement("span");
      chip.className = "file-chip";
      chip.innerHTML = `
        <span class="file-chip-name">${escapeHtml(file.name)}</span>
        <small>${escapeHtml(formatFileSize(file.size))}</small>
      `;
      selectedFiles.appendChild(chip);
    });
  }

  function renderEditingFiles() {
    const visibleFiles = state.editingAttachments.filter((attachment) => !state.pendingDeletes.has(attachment.id));
    editingFiles.replaceChildren();
    editingFiles.hidden = visibleFiles.length === 0;

    visibleFiles.forEach((attachment) => {
      const chip = document.createElement("span");
      chip.className = "file-chip";
      chip.innerHTML = `
        <span class="file-chip-name">${escapeHtml(attachment.name)}</span>
        <small>已保存</small>
        <button type="button" data-existing-file="${escapeHtml(attachment.id)}" aria-label="移除附件 ${escapeHtml(attachment.name)}" title="保存时删除">×</button>
      `;
      editingFiles.appendChild(chip);
    });
  }

  function resetEditor(message, type) {
    form.reset();
    form.elements.date.value = getToday();
    state.editingId = null;
    state.editingAttachments = [];
    state.pendingDeletes.clear();
    selectedFiles.replaceChildren();
    selectedFiles.hidden = true;
    renderEditingFiles();
    cancelButton.hidden = true;
    setStatus(message || DEFAULT_STATUS, type || "");
  }

  async function startEditing(recordId) {
    if (!state.ownerUnlocked) return;
    const record = state.records.find((item) => item.id === recordId);
    if (!record) return;

    state.editingId = record.id;
    state.editingAttachments = [...(state.attachmentsByRecord.get(record.id) || [])];
    state.pendingDeletes.clear();

    form.elements.date.value = record.date || getToday();
    form.elements.category.value = record.category || "其他";
    form.elements.minutes.value = record.minutes || "";
    form.elements.mood.value = record.mood || "比较专注";
    form.elements.topic.value = record.topic || "";
    form.elements.summary.value = record.summary || "";
    form.elements.challenge.value = record.challenge || "";
    form.elements.nextStep.value = record.nextStep || "";
    fileInput.value = "";
    renderSelectedFiles();
    renderEditingFiles();

    cancelButton.hidden = false;
    submitButton.innerHTML = '更新这条记录 <span aria-hidden="true">↗</span>';
    setStatus("正在编辑已有记录，保存后会更新原内容。", "");
    const editorSection = document.getElementById("entry") || form.closest("section") || form;
    editorSection.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => form.elements.topic.focus(), 500);
  }

  async function setArchivedState(recordId, archived) {
    if (!state.ownerUnlocked) return;
    const record = state.records.find((item) => item.id === recordId);
    if (!record) return;

    const now = new Date().toISOString();
    const updatedRecord = {
      ...record,
      archived,
      archivedAt: archived ? now : null,
      updatedAt: now
    };

    try {
      await saveRecord(updatedRecord);
      await loadStoredData();
      if (state.editingId === recordId) resetEditor();
      renderStats();
      renderRecords();
      setStatus(archived ? "记录已归档，可在“已归档”中恢复。" : "记录已恢复到当前记录。", "success");
    } catch (error) {
      window.alert(`${archived ? "归档" : "恢复"}失败，请稍后重试。`);
    }
  }

  async function permanentlyDeleteRecord(recordId) {
    if (!state.ownerUnlocked) return;
    const record = state.records.find((item) => item.id === recordId);
    if (!record || !record.archived) return;
    if (!window.confirm(`永久删除“${record.topic}”吗？删除后无法恢复。`)) return;

    try {
      const attachments = state.attachmentsByRecord.get(recordId) || [];
      for (const attachment of attachments) {
        await removeAttachment(attachment.id);
      }
      await removeRecord(record);
      if (state.editingId === recordId) resetEditor();
      await loadStoredData();
      renderStats();
      renderRecords();
      setStatus("记录及附件已永久删除。", "success");
    } catch (error) {
      window.alert("永久删除失败，请稍后重试。");
    }
  }
  async function archiveAllRecords() {
    if (!state.ownerUnlocked) return;
    const activeRecords = state.records.filter((record) => !record.archived);
    if (!activeRecords.length) return;
    if (!window.confirm(`确定归档当前 ${activeRecords.length} 条学习记录吗？归档后可随时恢复。`)) return;

    const now = new Date().toISOString();
    try {
      for (const record of activeRecords) {
        await saveRecord({
          ...record,
          archived: true,
          archivedAt: now,
          updatedAt: now
        });
      }
      await loadStoredData();
      resetEditor();
      renderStats();
      renderRecords();
      setStatus(`已归档 ${activeRecords.length} 条记录，可在“已归档”中恢复。`, "success");
    } catch (error) {
      window.alert("批量归档失败，请稍后重试。");
    }
  }

  async function handleSubmit(event) {
    if (!state.ownerUnlocked) {
      event.preventDefault();
      setStatus("当前为访客只读模式，无法保存记录。", "error");
      return;
    }
    event.preventDefault();

    if (!form.reportValidity()) {
      setStatus("请先补全标有 * 的必填内容。", "error");
      return;
    }

    const files = Array.from(fileInput.files || []);
    const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setStatus(`“${oversized.name}”超过 10 MB，请压缩或更换文件。`, "error");
      return;
    }

    const now = new Date().toISOString();
    const existingRecord = state.editingId
      ? state.records.find((record) => record.id === state.editingId)
      : null;
    const record = {
      id: existingRecord ? existingRecord.id : createId(),
      date: form.elements.date.value,
      category: form.elements.category.value,
      minutes: Number(form.elements.minutes.value),
      mood: form.elements.mood.value,
      topic: form.elements.topic.value.trim(),
      summary: form.elements.summary.value.trim(),
      challenge: form.elements.challenge.value.trim(),
      nextStep: form.elements.nextStep.value.trim(),
      archived: existingRecord ? Boolean(existingRecord.archived) : false,
      archivedAt: existingRecord ? existingRecord.archivedAt || null : null,
      createdAt: existingRecord ? existingRecord.createdAt : now,
      updatedAt: now
    };

    setFormBusy(true);
    setStatus("正在保存记录…", "");

    try {
      await saveRecord(record);

      for (const attachmentId of state.pendingDeletes) {
        await removeAttachment(attachmentId);
      }

      for (const file of files) {
        await saveAttachment(file, record.id);
      }

      await loadStoredData();
      resetEditor("学习记录已保存，可以继续填写下一天。", "success");
      renderStats();
      renderRecords();
    } catch (error) {
      await loadStoredData();
      renderStats();
      renderRecords();
      setStatus(`保存失败：${error.message || "请稍后重试"}`, "error");
    } finally {
      setFormBusy(false);
    }
  }

  function bindEvents() {
    form.addEventListener("submit", handleSubmit);
    fileInput.addEventListener("change", renderSelectedFiles);
    searchInput.addEventListener("input", renderRecords);
    categoryFilter.addEventListener("change", renderRecords);
    if (archiveStatusFilter) archiveStatusFilter.addEventListener("change", renderRecords);
    if (archiveAllButton) archiveAllButton.addEventListener("click", archiveAllRecords);
    cancelButton.addEventListener("click", () => resetEditor());
    if (ownerLoginForm) ownerLoginForm.addEventListener("submit", handleOwnerLogin);
    if (ownerLogoutButton) ownerLogoutButton.addEventListener("click", handleOwnerLogout);

    editingFiles.addEventListener("click", (event) => {
      const button = event.target.closest("[data-existing-file]");
      if (!button) return;
      state.pendingDeletes.add(button.dataset.existingFile);
      renderEditingFiles();
      setStatus("附件将在保存后删除。", "");
    });

    recordList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const recordId = button.dataset.recordId;
      if (button.dataset.action === "edit") startEditing(recordId);
      if (button.dataset.action === "archive") setArchivedState(recordId, true);
      if (button.dataset.action === "restore") setArchivedState(recordId, false);
      if (button.dataset.action === "delete-permanent") permanentlyDeleteRecord(recordId);
    });
  }

  async function initialize() {
    state.ownerUnlocked = readOwnerSession();
    form.elements.date.value = getToday();
    populateCategoryFilter();
    bindEvents();

    applyPermissions(
      state.ownerUnlocked ? "本人管理模式已恢复。" : "当前为访客只读模式。",
      state.ownerUnlocked ? "success" : ""
    );

    try {
      await openDatabase();
      state.dbReady = true;
    } catch (error) {
      state.dbReady = false;
      setStatus("当前浏览器无法保存附件，学习文字记录仍会正常保存。", "error");
    }

    try {
      await loadStoredData();
    } catch (error) {
      state.records = [];
      state.attachmentsByRecord = new Map();
      setStatus("读取本地记录失败，请检查浏览器存储权限。", "error");
    }

    renderStats();
    renderRecords();
  }

  initialize();
})();