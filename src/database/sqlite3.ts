import Database from 'better-sqlite3';

export class AnalyticsDB {
    private db: Database.Database;

    constructor() {
        this.db = new Database('analytics.db');
        this.initializeDB();
    }

    private initializeDB() {
        // Create the analytics table
        const createTable = `
            CREATE TABLE IF NOT EXISTS cast_analytics (
                hash TEXT PRIMARY KEY,
                similarity_score REAL NOT NULL,
                similarity_category TEXT NOT NULL,
                analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                cast_text TEXT,
                author_username TEXT
            )
        `;
        
        this.db.exec(createTable);
    }

    addAnalysis(data: {
        hash: string;
        similarity_score: number;
        similarity_category: string;
        cast_text?: string;
        author_username?: string;
        timestamp?: string;
    }) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO cast_analytics 
            (hash, similarity_score, similarity_category, cast_text, author_username) 
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(
            data.hash,
            data.similarity_score,
            data.similarity_category,
            data.cast_text,
            data.author_username
        );
    }

    getByHash(hash: string) {
        const stmt = this.db.prepare('SELECT * FROM cast_analytics WHERE hash = ?');
        return stmt.get(hash);
    }

    getBySimscore(similarity_score: number) {
        const stmt = this.db.prepare('SELECT * FROM cast_analytics WHERE similarity_score = ?');
        return stmt.get(similarity_score);
    }

    getAllBySimscoreGT(similarity_score: number) {
        const stmt = this.db.prepare('SELECT * FROM cast_analytics WHERE similarity_score > ?');
        return stmt.all(similarity_score);
    }

    getAllAnalytics() {
        const stmt = this.db.prepare('SELECT * FROM cast_analytics ORDER BY analyzed_at DESC');
        return stmt.all();
    }

    // Good practice to close the database connection when done
    close() {
        this.db.close();
    }
}