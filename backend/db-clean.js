const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "data.db");

if (fs.existsSync(dbPath)) {
    try {
        fs.unlinkSync(dbPath);
        console.log("✅ Database dihapus. Jalankan 'node server.js' untuk buat ulang.");
    } catch (e) {
        console.error("❌ Gagal hapus database:", e.message);
        process.exit(1);
    }
} else {
    console.log("ℹ️ Database sudah bersih, tidak ada file data.db");
}