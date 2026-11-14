-- CieloPlay / Cloudflare D1. Compatible con el SQLite local exportado.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS artists(
 id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
 description TEXT NOT NULL DEFAULT '', cover TEXT NOT NULL DEFAULT '',
 accent TEXT NOT NULL DEFAULT '#a17aff', genre TEXT NOT NULL DEFAULT '',
 source_url TEXT NOT NULL DEFAULT '', published INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS albums(
 id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
 artist_id TEXT NOT NULL REFERENCES artists(id), year INTEGER NOT NULL DEFAULT 0,
 cover TEXT NOT NULL DEFAULT '', genre TEXT NOT NULL DEFAULT '',
 release_type TEXT NOT NULL DEFAULT '', source_url TEXT NOT NULL DEFAULT '',
 published INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS tracks(
 id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL,
 artist_id TEXT NOT NULL REFERENCES artists(id), album_id TEXT NOT NULL REFERENCES albums(id),
 duration INTEGER NOT NULL DEFAULT 0, audio_url TEXT NOT NULL DEFAULT '',
 cover TEXT NOT NULL DEFAULT '', plays INTEGER NOT NULL DEFAULT 0,
 track_number INTEGER NOT NULL DEFAULT 0, source_status TEXT NOT NULL DEFAULT 'unverified',
 source_page TEXT NOT NULL DEFAULT '', published INTEGER NOT NULL DEFAULT 1,
 search_text TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS import_meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_albums_published_year ON albums(published, year DESC, title);
CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums(artist_id, year DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id, published, track_number);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id, published, track_number);
CREATE INDEX IF NOT EXISTS idx_tracks_published ON tracks(published, id);
CREATE INDEX IF NOT EXISTS idx_tracks_source_url ON tracks(audio_url);
CREATE INDEX IF NOT EXISTS idx_tracks_search_prefix ON tracks(search_text COLLATE NOCASE);
