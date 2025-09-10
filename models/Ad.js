const mongoose = require("mongoose");

const adSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    images: [{ type: String }] // массив путей к изображениям
});

module.exports = mongoose.model("Ad", adSchema);