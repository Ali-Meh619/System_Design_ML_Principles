(function () {
  const topics = Array.isArray(window.TOPICS) ? window.TOPICS : [];
  const state = {
    query: "",
    category: "All"
  };

  const el = {
    searchInput: document.getElementById("searchInput"),
    tagFilters: document.getElementById("tagFilters"),
    topicGrid: document.getElementById("topicGrid"),
    emptyState: document.getElementById("emptyState"),
    topicCount: document.getElementById("topicCount"),
    categoryCount: document.getElementById("categoryCount"),
    visibleCount: document.getElementById("visibleCount")
  };

  const categories = ["All"].concat(
    Array.from(new Set(topics.map(t => t.category))).sort((a, b) => a.localeCompare(b))
  );

  function normalize(value) {
    return (value || "").toLowerCase().trim();
  }

  function matches(topic) {
    const q = normalize(state.query);
    const inCategory = state.category === "All" || topic.category === state.category;
    if (!inCategory) {
      return false;
    }
    if (!q) {
      return true;
    }
    const haystack = `${topic.title} ${topic.category} ${topic.summary}`.toLowerCase();
    return haystack.includes(q);
  }

  function renderFilters() {
    el.tagFilters.innerHTML = "";
    categories.forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-btn${state.category === category ? " active" : ""}`;
      button.textContent = category;
      button.addEventListener("click", () => {
        state.category = category;
        render();
      });
      el.tagFilters.appendChild(button);
    });
  }

  function renderCards() {
    const filtered = topics.filter(matches);
    el.topicGrid.innerHTML = "";

    filtered.forEach(topic => {
      const card = document.createElement("article");
      card.className = "topic-card";

      const category = document.createElement("p");
      category.className = "card-category";
      category.textContent = topic.category;

      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = topic.title;

      const summary = document.createElement("p");
      summary.className = "card-summary";
      summary.textContent = topic.summary;

      const link = document.createElement("a");
      link.className = "card-link";
      link.href = topic.path;
      link.textContent = "Open topic";

      card.append(category, title, summary, link);
      el.topicGrid.appendChild(card);
    });

    el.emptyState.hidden = filtered.length > 0;
    el.visibleCount.textContent = String(filtered.length);
  }

  function renderStats() {
    el.topicCount.textContent = String(topics.length);
    el.categoryCount.textContent = String(categories.length - 1);
  }

  function render() {
    renderFilters();
    renderCards();
    renderStats();
  }

  el.searchInput.addEventListener("input", event => {
    state.query = event.target.value;
    renderCards();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "/" && document.activeElement !== el.searchInput) {
      event.preventDefault();
      el.searchInput.focus();
    }
  });

  render();
})();
