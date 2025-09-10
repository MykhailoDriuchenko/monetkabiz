require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const multer = require("multer");
const methodOverride = require("method-override");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const User = require("./models/User");
const Ad = require("./models/Ad");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ===== Подготовка папки uploads =====
const uploadsDir = path.join(__dirname, "public", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// Настройка multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (ext && mimetype) cb(null, true);
    else cb(new Error("Только изображения (jpg, png, gif)"));
};
const upload = multer({ storage, fileFilter });

// ===== Подключение к Mongo =====
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

// ===== Middleware =====
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.use(session({
    secret: "O>cf#pR?*#p#m/NCYy(ju~FCG4CDA&>rwp,V);X99fL–FRNo}y",
    resave: false,
    saveUninitialized: false
}));

// ===== Текущий пользователь =====
const getCurrentUser = async(req, res, next) => {
    if (req.session.userId) {
        res.locals.user = await User.findById(req.session.userId);
    } else {
        res.locals.user = null;
    }
    next();
};
app.use(getCurrentUser);

// ===== Главная страница =====
app.get("/", async(req, res) => {
    const queryParam = req.query.q || "";
    const sortParam = req.query.sort || "";

    let filter = {};
    if (queryParam) filter.title = { $regex: queryParam, $options: "i" };

    let adsQuery = Ad.find(filter);
    if (sortParam === "asc") adsQuery = adsQuery.sort({ price: 1 });
    else if (sortParam === "desc") adsQuery = adsQuery.sort({ price: -1 });

    const ads = await adsQuery.exec();

    let fav_ids = [];
    if (res.locals.user) fav_ids = res.locals.user.favorites.map(f => f.toString());

    res.render("index", {
        ads,
        fav_ids,
        query: queryParam,
        sort: sortParam,
        title: "Маркетплейс"
    });
});

// ===== Добавление объявления =====
// Добавление объявления с несколькими изображениями
app.post("/add", upload.array("images", 10), async(req, res) => {
    try {
        if (!res.locals.user) return res.redirect("/login");

        const files = req.files.map(f => f.filename);

        const newAd = new Ad({
            title: req.body.title,
            description: req.body.description,
            price: parseFloat(req.body.price),
            images: files,
            user: res.locals.user._id
        });

        await newAd.save();
        res.redirect(`/ad/${newAd._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Ошибка при добавлении объявления");
    }
});

// ===== Просмотр объявления =====
app.get("/ad/:id", async(req, res) => {
    const ad = await Ad.findById(req.params.id).populate("user");
    if (!ad) return res.send("Объявление не найдено");

    res.render("ad", {
        ad,
        fav_ids: res.locals.user ? res.locals.user.favorites.map(f => f.toString()) : [],
        title: ad.title
    });
});

// ===== Редактирование объявления =====

// Страница редактирования
app.get("/edit/:id", async(req, res) => {
    if (!res.locals.user) return res.redirect("/login");

    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.send("Объявление не найдено");

    // Проверяем права пользователя
    if (!ad.user.equals(res.locals.user._id) && res.locals.user.role !== "admin") {
        return res.status(403).send("Нет доступа для редактирования");
    }

    res.render("edit", { ad, title: "Редактировать объявление" });
});

// PUT /ad/:id — редактирование с удалением и добавлением изображений
app.put("/ad/:id", upload.array("images", 10), async(req, res) => {
    if (!res.locals.user) return res.redirect("/login");

    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) return res.send("Объявление не найдено");

        // Проверка прав
        if (!ad.user.equals(res.locals.user._id) && res.locals.user.role !== "admin") {
            return res.status(403).send("Нет доступа");
        }

        // 1. Удаление выбранных изображений
        if (req.body.deleteImages) {
            const indexesToDelete = Array.isArray(req.body.deleteImages) ?
                req.body.deleteImages.map(i => parseInt(i)) : [parseInt(req.body.deleteImages)];

            indexesToDelete.forEach(i => {
                const filename = ad.images[i];
                if (filename) {
                    const filePath = path.join(__dirname, "public/uploads", filename);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
            });

            ad.images = ad.images.filter((_, idx) => !indexesToDelete.includes(idx));
        }

        // 2. Добавление новых изображений
        if (req.files && req.files.length > 0) {
            const newFiles = req.files.map(f => f.filename);
            ad.images.push(...newFiles);
        }

        // 3. Обновление остальных полей
        ad.title = req.body.title || ad.title;
        ad.price = parseFloat(req.body.price) || ad.price;
        ad.description = req.body.description || ad.description;

        await ad.save();
        res.redirect(`/ad/${ad._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Ошибка при редактировании объявления");
    }
});

// ===== Удаление отдельного изображения через форму (не обязательно, можно использовать выше) =====
app.post("/ad/:id/delete-image", async(req, res) => {
    if (!res.locals.user) return res.redirect("/login");

    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.send("Объявление не найдено");

    if (!ad.user.equals(res.locals.user._id) && res.locals.user.role !== "admin") {
        return res.status(403).send("Нет доступа");
    }

    const imgIndex = parseInt(req.body.imgIndex);
    if (!isNaN(imgIndex) && ad.images[imgIndex]) {
        const filePath = path.join(__dirname, "public/uploads", ad.images[imgIndex]);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        ad.images.splice(imgIndex, 1);
        await ad.save();
    }

    res.redirect(`/edit/${ad._id}`);
});

// Удаление объявления
app.post("/delete/:id", async(req, res) => {
    if (!res.locals.user) return res.redirect("/login");

    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) return res.send("Объявление не найдено");

        // Проверяем, является ли текущий пользователь владельцем объявления
        if (!ad.user.equals(res.locals.user._id)) {
            return res.status(403).send("Нет прав на удаление");
        }

        // Удаляем изображения с сервера
        if (ad.images && ad.images.length > 0) {
            ad.images.forEach(filename => {
                const filePath = path.join(__dirname, "public", "uploads", filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        }

        // Удаляем объявление из базы
        await ad.deleteOne();
        res.redirect("/"); // или на страницу избранного, если удалялось оттуда
    } catch (err) {
        console.error("Error deleting ad:", err);
        res.status(500).send("Ошибка при удалении объявления");
    }
});

// ===== Избранное =====
app.post("/favorite/:id", async(req, res) => {
    if (!res.locals.user) return res.redirect("/login");

    const adId = req.params.id;
    const user = res.locals.user;

    if (user.favorites.includes(adId)) user.favorites.pull(adId);
    else user.favorites.push(adId);

    await user.save();
    res.redirect(req.headers.referer || "/");
});

app.get("/favorites", async(req, res) => {
    if (!res.locals.user) return res.redirect("/login");
    await res.locals.user.populate("favorites");
    res.render("favorites", {
        ads: res.locals.user.favorites,
        fav_ids: res.locals.user.favorites.map(f => f._id.toString()),
        title: "Избранное"
    });
});

// ===== Регистрация =====
app.get("/register", (req, res) => res.render("register", { title: "Регистрация" }));
app.post("/register", async(req, res) => {
    const { username, password } = req.body;

    // Проверка безопасности пароля
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // Объяснение:
    // - минимум 8 символов
    // - хотя бы одна заглавная буква
    // - хотя бы одна строчная буква
    // - хотя бы одна цифра
    // - хотя бы один специальный символ (@$!%*?&)

    if (!passwordRegex.test(password)) {
        return res.send("Пароль слишком простой. Используйте минимум 8 символов, включая заглавные, строчные, цифры и специальные символы.");
    }

    try {
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashed });
        await user.save();
        res.redirect("/login");
    } catch (err) {
        console.error(err);
        res.send("Имя пользователя занято или произошла ошибка.");
    }
});


// ===== Логин =====
app.get("/login", (req, res) => res.render("login", { title: "Вход" }));
app.post("/login", async(req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        req.session.userId = user._id;
        res.redirect("/");
    } else res.send("Неверные данные");
});

// ===== Логаут =====
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// ===== Подсказки поиска =====
app.get("/search_suggestions", async(req, res) => {
    const q = req.query.q || "";
    if (!q || q.length < 2) return res.json([]);

    try {
        const results = await Ad.find({ title: { $regex: q, $options: "i" } })
            .limit(10)
            .select("title price");

        const suggestions = results.map(ad => ({
            id: ad._id.toString(),
            title: ad.title,
            price: ad.price
        }));

        res.json(suggestions);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

// ===== Запуск =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));