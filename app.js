require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./routes/auth");
const adsRoutes = require("./routes/ads");
const favoriteRoutes = require("./routes/favorites");
const searchRoutes = require("./routes/search");

const Ad = require("./models/Ad");
const Favorite = require("./models/Favorite");

const app = express();

// Настройки
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Сессии
app.use(session({
    secret: process.env.SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// Роуты
app.use(authRoutes);
app.use(adsRoutes);
app.use(favoriteRoutes);
app.use(searchRoutes);

// Главная страница
app.get("/", async(req, res) => {
    const ads = await Ad.find().sort({ createdAt: -1 });
    let favIds = [];
    if (req.session.userId) {
        const favorites = await Favorite.find({ userId: req.session.userId });
        favIds = favorites.map(f => f.adId.toString());
    }
    res.render("index", { ads, userId: req.session.userId, favIds });
});

// Подключение к MongoDB и запуск сервера
mongoose.connect(process.env.MONGO_URI)
    .then(() => app.listen(3000, () => console.log("Server started on port 3000")))
    .catch(err => console.error(err));