const state = {
    token: localStorage.getItem("vocabapp_token") || "",
    username: localStorage.getItem("vocabapp_username") || "",
    sets: [],
    setSearchQuery: "",
    selectedSetId: null,
    selectedSet: null,
    stats: null,
    flashcards: [],
    flashcardIndex: 0,
    flashcardRevealed: false,
    reviewOnly: false,
    flashcardDragStart: null,
    flashcardWasDragged: false,
    typingIndex: 0,
    quiz: null,
    quizAnswers: {},
    quizResult: null,
    activeMode: "sets-mode",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const registerForm = $("#register-form");
const loginForm = $("#login-form");
const setForm = $("#set-form");
const addWordForm = $("#add-word-form");
const quizForm = $("#quiz-form");
const importForm = $("#import-form");
const typingForm = $("#typing-form");
const authFeedback = $("#auth-feedback");
const setFeedback = $("#set-feedback");
const addWordFeedback = $("#add-word-feedback");
const importFeedback = $("#import-feedback");
const typingFeedback = $("#typing-feedback");
const quizFeedback = $("#quiz-feedback");
const loginScreen = $("#login-screen");
const dashboardShell = $("#dashboard-shell");
const heroAuthStatus = $("#hero-auth-status");
const guestAuth = $("#guest-auth");
const accountSummary = $("#account-summary");
const currentUser = $("#current-user");
const setCount = $("#set-count");
const activeSetName = $("#active-set-name");
const nextStepTitle = $("#next-step-title");
const nextStepCopy = $("#next-step-copy");
const logoutButton = $("#logout-button");
const createSetGate = $("#create-set-gate");
const addWordGate = $("#add-word-gate");
const importGate = $("#import-gate");
const studyEmpty = $("#study-empty");
const studyContent = $("#study-content");
const selectedSetTitle = $("#selected-set-title");
const selectedSetBadge = $("#selected-set-badge");
const statWordCount = $("#stat-word-count");
const statMastery = $("#stat-mastery");
const statMasteryLabel = $("#stat-mastery-label");
const statReviewCount = $("#stat-review-count");
const statQuizCorrect = $("#stat-quiz-correct");
const statQuizRate = $("#stat-quiz-rate");
const statFlashcardRate = $("#stat-flashcard-rate");
const statAnswerCount = $("#stat-answer-count");
const statHardCount = $("#stat-hard-count");
const statMasteryDetail = $("#stat-mastery-detail");
const statMasteryDetailLabel = $("#stat-mastery-detail-label");
const setsList = $("#sets-list");
const setSearchInput = $("#set-search-input");
const refreshSetsButton = $("#refresh-sets");
const wordRows = $("#word-rows");
const wordRowTemplate = $("#word-row-template");
const addWordRowButton = $("#add-word-row");
const wordsTableBody = $("#words-table-body");
const addWordContext = $("#add-word-context");
const importContext = $("#import-context");
const flashcardsEmpty = $("#flashcards-empty");
const flashcardsContent = $("#flashcards-content");
const flashcardCard = $("#flashcard-card");
const flashcardSideLabel = $("#flashcard-side-label");
const flashcardValue = $("#flashcard-value");
const flashcardSubtitle = $("#flashcard-subtitle");
const flashcardProgress = $("#flashcard-progress");
const flashcardHardButton = $("#flashcard-hard-button");
const reviewFlashcardsButton = $("#review-flashcards");
const prevFlashcardButton = $("#prev-flashcard");
const nextFlashcardButton = $("#next-flashcard");
const flipFlashcardButton = $("#flip-flashcard");
const typingEmpty = $("#typing-empty");
const typingContext = $("#typing-context");
const nextTypingWordButton = $("#next-typing-word");
const quizBuilder = $("#quiz-builder");
const quizGate = $("#quiz-gate");
const quizRender = $("#quiz-render");
const tabButtons = $$("[data-tab-target]");
const modeButtons = $$("[data-mode-target]");
const modePanels = $$(".mode-panel");

function setFeedbackState(element, message = "", kind = "") {
    element.textContent = message;
    element.classList.remove("is-success", "is-error");
    if (kind) {
        element.classList.add(kind === "success" ? "is-success" : "is-error");
    }
}

async function apiFetch(url, options = {}, requiresAuth = false) {
    const headers = new Headers(options.headers || {});
    const hasBody = Object.prototype.hasOwnProperty.call(options, "body");
    const isFormData = hasBody && options.body instanceof FormData;

    if (hasBody && !isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    if (requiresAuth) {
        if (!state.token) {
            throw new Error("Ta akcja wymaga zalogowania.");
        }
        headers.set("Authorization", `Token ${state.token}`);
    }

    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401 && requiresAuth) {
            clearAuth(true);
        }
        throw new Error(data.error || data.message || "Wystąpił błąd podczas komunikacji z API.");
    }
    return data;
}

function isOwnSet(wordSet) {
    return Boolean(wordSet) && (wordSet.is_owner || wordSet.owner === state.username);
}

function pct(value) {
    return `${Math.round(Number(value || 0))}%`;
}

function currentFlashcard() {
    return state.flashcards[state.flashcardIndex] || null;
}

function setActiveMode(modeId) {
    state.activeMode = modeId;
    modeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.modeTarget === modeId));
    modePanels.forEach((panel) => panel.classList.toggle("is-hidden", panel.id !== modeId));
}

function setAuth(data) {
    state.token = data.token;
    state.username = data.username;
    localStorage.setItem("vocabapp_token", data.token);
    localStorage.setItem("vocabapp_username", data.username);
    renderAuthState();
}

function clearAuth(silent = false) {
    state.token = "";
    state.username = "";
    state.sets = [];
    state.selectedSetId = null;
    state.selectedSet = null;
    state.stats = null;
    state.flashcards = [];
    state.quiz = null;
    state.quizAnswers = {};
    state.quizResult = null;
    localStorage.removeItem("vocabapp_token");
    localStorage.removeItem("vocabapp_username");
    renderAuthState();
    if (!silent) {
        setFeedbackState(authFeedback, "Wylogowano z aplikacji.", "success");
    }
}

function createWordRow(values = {}) {
    const fragment = wordRowTemplate.content.cloneNode(true);
    const row = fragment.querySelector(".word-row");
    row.querySelector('input[name="pl"]').value = values.pl || "";
    row.querySelector('input[name="en"]').value = values.en || "";
    row.querySelector(".remove-row-button").addEventListener("click", () => {
        row.remove();
        if (!wordRows.children.length) {
            createWordRow();
        }
    });
    wordRows.appendChild(fragment);
}

function resetWordRows() {
    wordRows.innerHTML = "";
    createWordRow();
    createWordRow();
}

function collectWordsFromBuilder() {
    const words = [];
    for (const row of wordRows.querySelectorAll(".word-row")) {
        const pl = row.querySelector('input[name="pl"]').value.trim();
        const en = row.querySelector('input[name="en"]').value.trim();
        if (!pl && !en) {
            continue;
        }
        if (!pl || !en) {
            throw new Error("Każdy rozpoczęty wiersz słówka musi mieć wersję PL i EN.");
        }
        words.push({ pl, en });
    }
    return words;
}

function updateSummary() {
    currentUser.textContent = state.username || "-";
    setCount.textContent = state.sets.filter((item) => item.owner === state.username).length.toString();
    activeSetName.textContent = state.selectedSet ? state.selectedSet.name : "Brak";

    if (!state.selectedSet) {
        return;
    }
    if (state.stats?.review_words > 0) {
        nextStepTitle.textContent = "Masz słowa do powtórki";
        nextStepCopy.textContent = "Otwórz fiszki i wybierz tryb tylko do powtórki.";
    } else if ((state.stats?.mastery_percentage || 0) >= 80) {
        nextStepTitle.textContent = "Zestaw jest prawie opanowany";
        nextStepCopy.textContent = "Quiz pomoże utrzymać wynik i wyłapać pojedyncze słabe miejsca.";
    } else {
        nextStepTitle.textContent = "Kontynuuj naukę";
        nextStepCopy.textContent = "Fiszki i wpisywanie zapisują postęp, a quiz doda wynik do statystyk.";
    }
}

function renderAuthState() {
    const isLoggedIn = Boolean(state.token);
    heroAuthStatus.textContent = isLoggedIn ? "Zalogowano" : "Gość";
    heroAuthStatus.classList.toggle("neutral", !isLoggedIn);
    loginScreen.classList.toggle("is-hidden", isLoggedIn);
    dashboardShell.classList.toggle("is-hidden", !isLoggedIn);
    guestAuth.classList.toggle("is-hidden", isLoggedIn);
    accountSummary.classList.toggle("is-hidden", !isLoggedIn);
    createSetGate.classList.add("is-hidden");

    if (isLoggedIn) {
        setActiveMode(state.activeMode);
        loadSets();
    } else {
        renderSelectedSet();
    }
}

function renderSetList() {
    const query = state.setSearchQuery.trim().toLowerCase();
    const visibleSets = query
        ? state.sets.filter((wordSet) => wordSet.name.toLowerCase().includes(query))
        : state.sets;

    if (!state.sets.length) {
        setsList.className = "sets-list empty-state";
        setsList.textContent = "Nie ma jeszcze żadnych zestawów.";
        return;
    }

    if (!visibleSets.length) {
        setsList.className = "sets-list empty-state";
        setsList.textContent = `Nie znaleziono zestawu o nazwie "${state.setSearchQuery}".`;
        return;
    }

    setsList.className = "sets-list";
    setsList.innerHTML = "";
    visibleSets.forEach((wordSet) => {
        const item = document.createElement("div");
        item.className = "set-list-item";

        const button = document.createElement("button");
        button.type = "button";
        button.className = `set-card ${wordSet.id === state.selectedSetId ? "is-selected" : ""}`;
        button.innerHTML = `<strong></strong><span></span>`;
        button.querySelector("strong").textContent = wordSet.name;
        button.querySelector("span").textContent = `${wordSet.owner === state.username ? "Twój zestaw" : `Właściciel: ${wordSet.owner}`} | ${wordSet.public ? "Publiczny" : "Prywatny"}`;
        button.addEventListener("click", () => selectSet(wordSet.id));
        item.appendChild(button);

        if (wordSet.owner === state.username || wordSet.is_owner) {
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "set-delete-button";
            deleteButton.textContent = "Usuń zestaw";
            deleteButton.addEventListener("click", () => deleteSet(wordSet.id));
            item.appendChild(deleteButton);
        }

        setsList.appendChild(item);
    });
}

function renderStats() {
    const stats = state.stats || {};
    statWordCount.textContent = String(stats.total_words ?? state.selectedSet?.words.length ?? 0);
    statMastery.textContent = pct(stats.mastery_percentage);
    statMasteryLabel.textContent = stats.mastery_level || "Brak danych";
    statReviewCount.textContent = String(stats.review_words || 0);
    statQuizCorrect.textContent = `${stats.quiz_correct || 0}/${stats.quiz_questions || 0}`;
    statQuizRate.textContent = `${pct(stats.quiz_success_rate)} skuteczności | ${stats.quiz_attempts || 0} podejść`;
    statFlashcardRate.textContent = pct(stats.flashcard_success_rate);
    statAnswerCount.textContent = `${stats.total_attempts || 0} zapisanych odpowiedzi`;
    statHardCount.textContent = String(stats.hard_words || 0);
    statMasteryDetail.textContent = pct(stats.mastery_percentage);
    statMasteryDetailLabel.textContent = `${stats.mastered_words || 0}/${stats.total_words || 0} słów opanowanych`;
}

function renderWordTable() {
    wordsTableBody.innerHTML = "";
    if (!state.selectedSet || !state.selectedSet.words.length) {
        const row = document.createElement("tr");
        row.innerHTML = `<td class="table-empty" colspan="5">Ten zestaw nie ma jeszcze słówek.</td>`;
        wordsTableBody.appendChild(row);
        return;
    }

    state.selectedSet.words.forEach((word) => {
        const progress = word.progress || {};
        const row = document.createElement("tr");
        const status = progress.is_hard ? "Trudne" : progress.needs_review ? "Do powtórki" : progress.mastered ? "Opanowane" : "W nauce";
        row.innerHTML = `
            <td></td>
            <td></td>
            <td>${pct(progress.success_rate)} (${progress.correct_answers || 0}/${progress.attempts || 0})</td>
            <td><span class="word-status">${status}</span></td>
            <td></td>
        `;
        row.children[0].textContent = word.pl;
        row.children[1].textContent = word.en;

        const actionCell = row.children[4];
        const hardButton = document.createElement("button");
        hardButton.type = "button";
        hardButton.className = "table-action";
        hardButton.textContent = progress.is_hard ? "Odznacz trudne" : "Oznacz trudne";
        hardButton.addEventListener("click", () => toggleHardWord(word.id, !progress.is_hard));
        actionCell.appendChild(hardButton);

        if (isOwnSet(state.selectedSet)) {
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "table-action danger";
            deleteButton.textContent = "Usuń";
            deleteButton.addEventListener("click", () => deleteWord(word.id));
            actionCell.appendChild(deleteButton);
        }
        wordsTableBody.appendChild(row);
    });
}

function renderSelectedSet() {
    const hasSet = Boolean(state.selectedSet);
    studyEmpty.classList.toggle("is-hidden", true);
    studyContent.classList.toggle("is-hidden", false);
    if (!hasSet) {
        selectedSetTitle.textContent = "Brak zestawu";
        selectedSetBadge.textContent = "Wybierz lub utwórz zestaw";
        selectedSetBadge.classList.add("neutral");
        addWordGate.classList.remove("is-hidden");
        addWordGate.textContent = "Najpierw utwórz albo wybierz własny zestaw.";
        addWordForm.classList.add("is-hidden");
        importGate.classList.remove("is-hidden");
        importGate.textContent = "Import będzie dostępny po wybraniu własnego zestawu.";
        importForm.classList.add("is-hidden");
        renderStats();
        renderWordTable();
        renderFlashcards();
        renderTypingMode();
        renderQuiz();
        updateSummary();
        return;
    }

    selectedSetTitle.textContent = state.selectedSet.name;
    selectedSetBadge.textContent = state.selectedSet.public ? "Publiczny" : "Prywatny";
    selectedSetBadge.classList.toggle("neutral", false);

    if (isOwnSet(state.selectedSet)) {
        addWordGate.classList.add("is-hidden");
        addWordForm.classList.remove("is-hidden");
        importGate.classList.add("is-hidden");
        importForm.classList.remove("is-hidden");
        addWordContext.textContent = `Aktywny zestaw: ${state.selectedSet.name}`;
        importContext.textContent = `Aktywny zestaw: ${state.selectedSet.name}`;
    } else {
        addWordGate.classList.remove("is-hidden");
        addWordGate.textContent = "Dodawanie słów jest dostępne tylko dla właściciela zestawu.";
        addWordForm.classList.add("is-hidden");
        importGate.classList.remove("is-hidden");
        importGate.textContent = "Import jest dostępny tylko dla właściciela zestawu.";
        importForm.classList.add("is-hidden");
    }

    renderStats();
    renderWordTable();
    renderFlashcards();
    renderTypingMode();
    renderQuiz();
    updateSummary();
}

function renderFlashcards() {
    if (!state.selectedSet || !state.flashcards.length) {
        flashcardsEmpty.classList.remove("is-hidden");
        flashcardsEmpty.textContent = state.reviewOnly
            ? "Nie ma słów do powtórki w tym zestawie."
            : "Wybierz zestaw z przynajmniej jednym słówkiem.";
        flashcardsContent.classList.add("is-hidden");
        return;
    }

    const card = currentFlashcard();
    flashcardsEmpty.classList.add("is-hidden");
    flashcardsContent.classList.remove("is-hidden");
    flashcardSideLabel.textContent = state.flashcardRevealed ? "Polski" : "Angielski";
    flashcardValue.textContent = state.flashcardRevealed ? card.pl : card.en;
    flashcardSubtitle.textContent = card.progress?.needs_review
        ? "To słowo jest na liście powtórek."
        : card.progress?.mastered
            ? "To słowo jest oznaczone jako opanowane."
            : "Kliknij kartę albo obróć, żeby zobaczyć tłumaczenie.";
    flashcardProgress.textContent = `Karta ${state.flashcardIndex + 1} z ${state.flashcards.length}${state.reviewOnly ? " | tryb powtórki" : ""}. W lewo: powtórka, w prawo: opanowane.`;
    flashcardHardButton.textContent = card.progress?.is_hard ? "Odznacz trudne" : "Oznacz jako trudne";
    reviewFlashcardsButton.textContent = state.reviewOnly ? "Wszystkie fiszki" : "Tylko do powtórki";
}

function renderTypingMode() {
    if (!state.selectedSet || !state.selectedSet.words.length) {
        typingEmpty.classList.remove("is-hidden");
        typingForm.classList.add("is-hidden");
        return;
    }
    if (state.typingIndex >= state.selectedSet.words.length) {
        state.typingIndex = 0;
    }
    const word = state.selectedSet.words[state.typingIndex];
    typingEmpty.classList.add("is-hidden");
    typingForm.classList.remove("is-hidden");
    typingContext.textContent = `Przetłumacz na angielski: ${word.pl} (${state.typingIndex + 1} z ${state.selectedSet.words.length})`;
}

function getCorrectAnswerText(question) {
    return question.options[question.correct_option - 1];
}

function renderQuiz() {
    if (!state.selectedSet || state.selectedSet.words.length < 4) {
        quizGate.classList.remove("is-hidden");
        quizBuilder.classList.add("is-hidden");
        quizGate.textContent = state.selectedSet
            ? `Do quizu potrzebujesz jeszcze ${4 - state.selectedSet.words.length} słówek.`
            : "Wybierz zestaw i dodaj co najmniej 4 słówka.";
        quizRender.innerHTML = "";
        return;
    }

    quizGate.classList.add("is-hidden");
    quizBuilder.classList.remove("is-hidden");
    quizForm.elements.name.value = quizForm.elements.name.value || `${state.selectedSet.name} quiz`;
    if (!state.quiz) {
        quizRender.innerHTML = "";
        return;
    }

    const form = document.createElement("form");
    form.className = "quiz-questions";
    const resultsByQuestion = new Map((state.quizResult?.results || []).map((item) => [item.question_id, item]));

    state.quiz.questions.forEach((question, index) => {
        const card = document.createElement("section");
        card.className = "question-card";
        const title = document.createElement("h3");
        title.textContent = `${index + 1}. Jak po angielsku powiedzieć: ${question.pl}?`;
        card.appendChild(title);

        question.options.forEach((option, optionIndex) => {
            const label = document.createElement("label");
            label.className = "option-row";
            const input = document.createElement("input");
            input.type = "radio";
            input.name = `question-${question.id}`;
            input.value = String(optionIndex + 1);
            input.checked = state.quizAnswers[question.id] === optionIndex + 1;
            input.addEventListener("change", () => {
                state.quizAnswers[question.id] = optionIndex + 1;
                state.quizResult = null;
                setFeedbackState(quizFeedback);
            });
            const text = document.createElement("span");
            text.textContent = option;
            label.append(input, text);
            card.appendChild(label);
        });

        if (state.quizResult) {
            const result = resultsByQuestion.get(question.id);
            const note = document.createElement("p");
            note.className = result?.is_correct ? "result-note success" : "result-note error";
            note.textContent = result?.is_correct ? "Poprawna odpowiedź." : `Poprawna odpowiedź: ${result?.correct_answer || getCorrectAnswerText(question)}`;
            card.appendChild(note);
        }
        form.appendChild(card);
    });

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "primary-button";
    submit.textContent = "Sprawdź wynik";
    form.appendChild(submit);
    form.addEventListener("submit", submitQuiz);

    const wrapper = document.createElement("div");
    wrapper.className = "quiz-wrapper";
    const title = document.createElement("div");
    title.className = "quiz-title";
    title.innerHTML = `<strong></strong><p class="section-copy">Quiz został wygenerowany z aktywnego zestawu.</p>`;
    title.querySelector("strong").textContent = state.quiz.quiz.name;
    wrapper.append(title, form);

    if (state.quizResult) {
        const summary = document.createElement("div");
        summary.className = "result-banner";
        summary.textContent = `Masz ${state.quizResult.correct_count}/${state.quizResult.total_questions}. Wynik: ${state.quizResult.score_percentage}%.`;
        wrapper.appendChild(summary);
    }
    quizRender.innerHTML = "";
    quizRender.appendChild(wrapper);
}

async function loadSelectedSet(setId) {
    const [set, flashcards, stats] = await Promise.all([
        apiFetch(`/api/sets/${setId}/`, {}, true),
        apiFetch(`/api/sets/${setId}/flashcards/`, {}, true),
        apiFetch(`/api/sets/${setId}/stats/`, {}, true),
    ]);

    state.selectedSet = set;
    state.selectedSetId = set.id;
    state.stats = stats;
    state.flashcards = flashcards;
    state.flashcardIndex = 0;
    state.flashcardRevealed = false;
    state.reviewOnly = false;
    state.typingIndex = 0;
    state.quiz = null;
    state.quizAnswers = {};
    state.quizResult = null;
    typingForm.reset();
    renderSetList();
    renderSelectedSet();
}

async function selectSet(setId) {
    try {
        [setFeedback, addWordFeedback, importFeedback, typingFeedback, quizFeedback].forEach((item) => setFeedbackState(item));
        await loadSelectedSet(setId);
    } catch (error) {
        setFeedbackState(setFeedback, error.message, "error");
    }
}

async function loadSets() {
    if (!state.token) {
        return;
    }
    try {
        setsList.className = "sets-list empty-state";
        setsList.textContent = "Pobieram zestawy...";
        state.sets = await apiFetch("/api/sets/", {}, true);
        renderSetList();
        const availableIds = new Set(state.sets.map((item) => item.id));
        const targetId = state.selectedSetId && availableIds.has(state.selectedSetId)
            ? state.selectedSetId
            : state.sets[0]?.id;
        if (targetId) {
            await loadSelectedSet(targetId);
        } else {
            state.selectedSet = null;
            renderSelectedSet();
        }
        updateSummary();
    } catch (error) {
        setsList.className = "sets-list empty-state";
        setsList.textContent = error.message;
    }
}

async function refreshCurrentSet() {
    if (state.selectedSetId) {
        await loadSelectedSet(state.selectedSetId);
    }
}

async function refreshStatsOnly() {
    if (!state.selectedSetId) {
        return;
    }
    state.stats = await apiFetch(`/api/sets/${state.selectedSetId}/stats/`, {}, true);
    renderStats();
    updateSummary();
}

function applyUpdatedWord(updatedWord) {
    const replaceWord = (word) => (word.id === updatedWord.id ? updatedWord : word);
    if (state.selectedSet) {
        state.selectedSet.words = state.selectedSet.words.map(replaceWord);
    }
    state.flashcards = state.flashcards.map(replaceWord);
}

async function toggleHardWord(wordId, isHard) {
    try {
        await apiFetch(`/api/words/${wordId}/toggle-hard/`, {
            method: "POST",
            body: JSON.stringify({ is_hard: isHard }),
        }, true);
        await refreshCurrentSet();
        setFeedbackState(addWordFeedback, isHard ? "Słówko oznaczone jako trudne." : "Słówko zdjęte z listy trudnych.", "success");
    } catch (error) {
        setFeedbackState(addWordFeedback, error.message, "error");
    }
}

async function deleteWord(wordId) {
    try {
        await apiFetch(`/api/words/${wordId}/delete/`, { method: "DELETE" }, true);
        setFeedbackState(addWordFeedback, "Słówko zostało usunięte.", "success");
        await loadSets();
    } catch (error) {
        setFeedbackState(addWordFeedback, error.message, "error");
    }
}

async function deleteSet(setId) {
    if (!confirm("Usunąć ten zestaw razem ze słówkami i quizami?")) {
        return;
    }

    try {
        await apiFetch(`/api/sets/${setId}/delete/`, { method: "DELETE" }, true);
        if (state.selectedSetId === setId) {
            state.selectedSetId = null;
            state.selectedSet = null;
            state.flashcards = [];
            state.stats = null;
        }
        setFeedbackState(setFeedback, "Zestaw został usunięty.", "success");
        await loadSets();
    } catch (error) {
        setFeedbackState(setFeedback, error.message, "error");
    }
}

async function submitFlashcardProgress(action) {
    const card = currentFlashcard();
    if (!card) {
        return;
    }

    try {
        const result = await apiFetch(`/api/words/${card.id}/flashcard-progress/`, {
            method: "POST",
            body: JSON.stringify({ action }),
        }, true);
        applyUpdatedWord(result.word);

        if (state.reviewOnly && action === "mastered") {
            state.flashcards = state.flashcards.filter((word) => word.id !== card.id);
            if (state.flashcardIndex >= state.flashcards.length) {
                state.flashcardIndex = 0;
            }
        } else {
            moveFlashcard(1);
        }

        state.flashcardRevealed = false;
        await refreshStatsOnly();
        renderWordTable();
        renderFlashcards();
    } catch (error) {
        setFeedbackState(addWordFeedback, error.message, "error");
    }
}

async function submitQuiz(event) {
    event.preventDefault();
    const unanswered = state.quiz.questions.some((question) => !state.quizAnswers[question.id]);
    if (unanswered) {
        setFeedbackState(quizFeedback, "Wybierz odpowiedzi na wszystkie pytania.", "error");
        return;
    }
    try {
        const quizData = state.quiz;
        const result = await apiFetch(`/api/quizzes/${state.quiz.quiz.id}/submit/`, {
            method: "POST",
            body: JSON.stringify({ answers: state.quizAnswers }),
        }, true);
        state.quizResult = result;
        setFeedbackState(quizFeedback, `Wynik: ${state.quizResult.correct_count}/${state.quizResult.total_questions} (${state.quizResult.score_percentage}%).`, "success");
        const selectedId = state.selectedSetId;
        await loadSelectedSet(selectedId);
        state.quiz = quizData;
        state.quizResult = result;
        renderQuiz();
    } catch (error) {
        setFeedbackState(quizFeedback, error.message, "error");
    }
}

function moveFlashcard(step) {
    if (!state.flashcards.length) {
        return;
    }
    state.flashcardIndex = (state.flashcardIndex + step + state.flashcards.length) % state.flashcards.length;
    state.flashcardRevealed = false;
    renderFlashcards();
}

tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        tabButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        registerForm.classList.toggle("is-hidden", button.dataset.tabTarget !== "register-form");
        loginForm.classList.toggle("is-hidden", button.dataset.tabTarget !== "login-form");
        setFeedbackState(authFeedback);
    });
});

modeButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveMode(button.dataset.modeTarget));
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    try {
        const data = await apiFetch("/api/register/", {
            method: "POST",
            body: JSON.stringify({
                username: formData.get("username"),
                password: formData.get("password"),
            }),
        });
        setAuth(data);
        registerForm.reset();
    } catch (error) {
        setFeedbackState(authFeedback, error.message, "error");
    }
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    try {
        const data = await apiFetch("/api/login/", {
            method: "POST",
            body: JSON.stringify({
                username: formData.get("username"),
                password: formData.get("password"),
            }),
        });
        setAuth(data);
        loginForm.reset();
    } catch (error) {
        setFeedbackState(authFeedback, error.message, "error");
    }
});

setForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
        const formData = new FormData(setForm);
        const words = collectWordsFromBuilder();
        const created = await apiFetch("/api/sets/create/", {
            method: "POST",
            body: JSON.stringify({
                name: formData.get("name"),
                public: formData.get("public") === "on",
                words,
            }),
        }, true);
        setForm.reset();
        resetWordRows();
        setFeedbackState(setFeedback, `Zestaw "${created.set.name}" został utworzony.`, "success");
        await loadSets();
        await selectSet(created.set.id);
    } catch (error) {
        setFeedbackState(setFeedback, error.message, "error");
    }
});

addWordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.selectedSet) {
        setFeedbackState(addWordFeedback, "Najpierw wybierz zestaw.", "error");
        return;
    }
    try {
        const formData = new FormData(addWordForm);
        await apiFetch(`/api/sets/${state.selectedSet.id}/add_word/`, {
            method: "POST",
            body: JSON.stringify({ pl: formData.get("pl"), en: formData.get("en") }),
        }, true);
        addWordForm.reset();
        setFeedbackState(addWordFeedback, "Nowe słówko zostało dodane.", "success");
        await loadSets();
        await selectSet(state.selectedSet.id);
    } catch (error) {
        setFeedbackState(addWordFeedback, error.message, "error");
    }
});

importForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.selectedSet || !isOwnSet(state.selectedSet)) {
        setFeedbackState(importFeedback, "Najpierw wybierz własny zestaw.", "error");
        return;
    }
    const file = importForm.elements.file.files[0];
    if (!file) {
        setFeedbackState(importFeedback, "Wybierz plik CSV lub JSON.", "error");
        return;
    }
    try {
        const payload = new FormData();
        payload.append("file", file);
        const result = await apiFetch(`/api/sets/${state.selectedSet.id}/import/`, {
            method: "POST",
            body: payload,
        }, true);
        importForm.reset();
        setFeedbackState(importFeedback, result.message || "Import zakończony.", "success");
        await loadSets();
        await selectSet(state.selectedSet.id);
    } catch (error) {
        setFeedbackState(importFeedback, error.message, "error");
    }
});

typingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.selectedSet || !state.selectedSet.words.length) {
        setFeedbackState(typingFeedback, "Najpierw wybierz zestaw ze słówkami.", "error");
        return;
    }
    const word = state.selectedSet.words[state.typingIndex];
    const formData = new FormData(typingForm);
    try {
        const result = await apiFetch(`/api/words/${word.id}/check/`, {
            method: "POST",
            body: JSON.stringify({ answer: formData.get("answer") }),
        }, true);
        setFeedbackState(
            typingFeedback,
            result.correct ? "Poprawnie! Postęp zapisany." : `Jeszcze nie. Poprawna odpowiedź: ${result.correct_answer}.`,
            result.correct ? "success" : "error"
        );
        await refreshCurrentSet();
    } catch (error) {
        setFeedbackState(typingFeedback, error.message, "error");
    }
});

quizForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.selectedSet) {
        setFeedbackState(quizFeedback, "Najpierw wybierz zestaw.", "error");
        return;
    }
    try {
        const formData = new FormData(quizForm);
        const created = await apiFetch(`/api/sets/${state.selectedSet.id}/quiz/`, {
            method: "POST",
            body: JSON.stringify({ name: formData.get("name") }),
        }, true);
        state.quiz = await apiFetch(`/api/quizzes/${created.quiz_id}/`, {}, true);
        state.quizAnswers = {};
        state.quizResult = null;
        setFeedbackState(quizFeedback, "Quiz jest gotowy.", "success");
        renderQuiz();
    } catch (error) {
        setFeedbackState(quizFeedback, error.message, "error");
    }
});

reviewFlashcardsButton.addEventListener("click", async () => {
    if (!state.selectedSet) {
        return;
    }
    try {
        if (state.reviewOnly) {
            state.flashcards = await apiFetch(`/api/sets/${state.selectedSet.id}/flashcards/`, {}, true);
            state.reviewOnly = false;
        } else {
            const result = await apiFetch(`/api/sets/${state.selectedSet.id}/review/`, {}, true);
            state.flashcards = result.words || [];
            state.reviewOnly = true;
        }
        state.flashcardIndex = 0;
        state.flashcardRevealed = false;
        renderFlashcards();
    } catch (error) {
        setFeedbackState(addWordFeedback, error.message, "error");
    }
});

logoutButton.addEventListener("click", () => clearAuth());
addWordRowButton.addEventListener("click", () => createWordRow());
refreshSetsButton.addEventListener("click", () => loadSets());
setSearchInput.addEventListener("input", () => {
    state.setSearchQuery = setSearchInput.value;
    renderSetList();
});
flashcardCard.addEventListener("click", () => {
    if (state.flashcardWasDragged) {
        state.flashcardWasDragged = false;
        return;
    }
    state.flashcardRevealed = !state.flashcardRevealed;
    renderFlashcards();
});
flipFlashcardButton.addEventListener("click", () => {
    state.flashcardRevealed = !state.flashcardRevealed;
    renderFlashcards();
});
flashcardHardButton.addEventListener("click", () => {
    const card = currentFlashcard();
    if (card) {
        toggleHardWord(card.id, !card.progress?.is_hard);
    }
});
nextTypingWordButton.addEventListener("click", () => {
    if (!state.selectedSet || !state.selectedSet.words.length) {
        return;
    }
    state.typingIndex = (state.typingIndex + 1) % state.selectedSet.words.length;
    typingForm.reset();
    setFeedbackState(typingFeedback);
    renderTypingMode();
});
prevFlashcardButton.addEventListener("click", () => submitFlashcardProgress("review"));
nextFlashcardButton.addEventListener("click", () => submitFlashcardProgress("mastered"));

flashcardCard.addEventListener("pointerdown", (event) => {
    state.flashcardDragStart = event.clientX;
    flashcardCard.setPointerCapture?.(event.pointerId);
});

flashcardCard.addEventListener("pointerup", (event) => {
    if (state.flashcardDragStart === null) {
        return;
    }
    const delta = event.clientX - state.flashcardDragStart;
    state.flashcardDragStart = null;
    if (Math.abs(delta) < 80) {
        return;
    }
    state.flashcardWasDragged = true;
    submitFlashcardProgress(delta > 0 ? "mastered" : "review");
});

resetWordRows();
renderAuthState();
