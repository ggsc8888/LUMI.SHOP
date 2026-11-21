import"server-only";import{createClient}from"@libsql/client";let client=null,ready=null;export async function db(){return client||(client=createClient({url:process.env.DATABASE_URL||"file:local.db",authToken:process.env.DATABASE_AUTH_TOKEN}),ready=client.batch([`CREATE TABLE IF NOT EXISTS shopify_connections (
            user_email TEXT PRIMARY KEY,
            shop TEXT NOT NULL,
            token_enc TEXT NOT NULL,
            scope TEXT,
            connected_at INTEGER NOT NULL
          )`,`CREATE TABLE IF NOT EXISTS user_settings (
            user_email TEXT PRIMARY KEY,
            json TEXT NOT NULL
          )`,`CREATE TABLE IF NOT EXISTS drafts (
            id TEXT PRIMARY KEY,
            user_email TEXT NOT NULL,
            shop TEXT NOT NULL,
            product_gid TEXT NOT NULL,
            title TEXT,
            created_at INTEGER NOT NULL
          )`],"write").then(()=>{})),await ready,client}
