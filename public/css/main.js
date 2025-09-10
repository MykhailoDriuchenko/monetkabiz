document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("suggestions");
    const searchForm = document.getElementById("searchForm");

    if (!input) return;

    // Предотвращаем отправку пустого поиска
    searchForm.addEventListener("submit", (e) => {
        if (input.value.trim() === "") e.preventDefault();
    });

    // Обработка ввода в поиске
    input.addEventListener("input", async() => {
        let query = input.value.trim();
        if (query.length < 2) {
            suggestionsBox.style.display = "none";
            return;
        }

        try {
            let response = await fetch(`/search_suggestions?q=${encodeURIComponent(query)}`);
            let suggestions = await response.json();

            suggestionsBox.innerHTML = "";
            if (suggestions.length > 0) {
                suggestionsBox.style.display = "block";
                suggestions.forEach(item => {
                    let div = document.createElement("div");
                    div.textContent = `${item.title} — ${item.price}₴`;
                    div.addEventListener("click", () => {
                        input.value = item.title;
                        suggestionsBox.style.display = "none";
                        window.location.href = `/ad/${item.id}`;
                    });
                    suggestionsBox.appendChild(div);
                });
            } else {
                suggestionsBox.style.display = "none";
            }
        } catch (err) {
            console.error("Ошибка при поиске подсказок:", err);
        }
    });

    // Скрытие подсказок при клике вне поля
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = "none";
        }
    });

    // Обработка кнопок "сердечко" избранного (AJAX)
    const favForms = document.querySelectorAll(".favorite-form");
    favForms.forEach(form => {
        form.addEventListener("submit", async(e) => {
            e.preventDefault();
            const action = form.getAttribute("action");
            try {
                const res = await fetch(action, { method: "POST" });
                if (res.ok) {
                    const btn = form.querySelector(".favorite-btn");
                    btn.classList.toggle("active");
                }
            } catch (err) {
                console.error("Ошибка при добавлении в избранное:", err);
            }
        });
    });
});
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("suggestions");
    const searchForm = document.getElementById("searchForm");

    if (!input) return;

    // Предотвращаем отправку пустого поиска
    searchForm.addEventListener("submit", (e) => {
        if (input.value.trim() === "") e.preventDefault();
    });

    // Обработка ввода в поиске
    input.addEventListener("input", async() => {
        let query = input.value.trim();
        if (query.length < 2) {
            suggestionsBox.style.display = "none";
            return;
        }

        try {
            let response = await fetch(`/search_suggestions?q=${encodeURIComponent(query)}`);
            let suggestions = await response.json();

            suggestionsBox.innerHTML = "";
            if (suggestions.length > 0) {
                suggestionsBox.style.display = "block";
                suggestions.forEach(item => {
                    let div = document.createElement("div");
                    div.textContent = `${item.title} — ${item.price}₴`;
                    div.addEventListener("click", () => {
                        input.value = item.title;
                        suggestionsBox.style.display = "none";
                        window.location.href = `/ad/${item.id}`;
                    });
                    suggestionsBox.appendChild(div);
                });
            } else {
                suggestionsBox.style.display = "none";
            }
        } catch (err) {
            console.error("Ошибка при поиске подсказок:", err);
        }
    });

    // Скрытие подсказок при клике вне поля
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = "none";
        }
    });

    // Обработка кнопок "сердечко" избранного (AJAX)
    const favForms = document.querySelectorAll(".favorite-form");
    favForms.forEach(form => {
        form.addEventListener("submit", async(e) => {
            e.preventDefault();
            const action = form.getAttribute("action");
            try {
                const res = await fetch(action, { method: "POST" });
                if (res.ok) {
                    const btn = form.querySelector(".favorite-btn");
                    btn.classList.toggle("active");
                }
            } catch (err) {
                console.error("Ошибка при добавлении в избранное:", err);
            }
        });
    });
});