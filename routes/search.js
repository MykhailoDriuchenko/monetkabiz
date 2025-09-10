let fuse;
let allAds = [];

// Загружаем все объявления 1 раз при загрузке страницы
fetch("/all_ads_json")
    .then(res => res.json())
    .then(data => {
        allAds = data;
        fuse = new Fuse(allAds, {
            keys: ["title"], // ищем только по названию
            threshold: 0.3, // чувствительность (0 = строгий поиск, 1 = очень мягкий)
        });
    });

// DOM элементы
const searchInput = document.getElementById("search-input");
const suggestions = document.getElementById("suggestions");

// debounce чтобы не спамить
let debounceTimer;
searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        showSuggestions(searchInput.value);
    }, 200);
});

function showSuggestions(query) {
    suggestions.innerHTML = "";
    if (!query || !fuse) return;

    const results = fuse.search(query, { limit: 10 });

    results.forEach(r => {
        const ad = r.item;
        const li = document.createElement("li");
        li.innerHTML = `<a href="/ad/${ad._id}">${ad.title} — ${ad.price}₴</a>`;
        suggestions.appendChild(li);
    });
}