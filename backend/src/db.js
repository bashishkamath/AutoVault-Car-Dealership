const Database=require('better-sqlite3');
const db=new Database(process.env.DB_PATH||'dealership.db');
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'customer');CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT,make TEXT NOT NULL,model TEXT NOT NULL,category TEXT NOT NULL,price REAL NOT NULL CHECK(price>=0),quantity INTEGER NOT NULL CHECK(quantity>=0));`);
module.exports=db;
