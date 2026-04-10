import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { api } from '../services/api';
import './components.css';

/**
 * PlaylistCreationPanel component - Interface for creating genre-based playlists
 * Supports multiple language selection with even song distribution
 */
export const PlaylistCreationPanel: React.FC = () => {
  const [genre, setGenre] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);
  const addSongToPlaylist = usePlaylistStore((state) => state.addSongToPlaylist);

  const commonGenres = ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Country', 'Bollywood', 'Metal', 'R&B', 'Latin'];

  const availableLanguages = ['English', 'Hindi', 'Spanish', 'French', 'Korean', 'Japanese', 'Mandarin', 'Portuguese', 'German', 'Italian'];

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((l) => l !== lang);
      }
      return [...prev, lang];
    });
  };

  const handleCreatePlaylist = async () => {
    setMessage(null);

    const trimmedGenre = genre.trim();
    if (!trimmedGenre) {
      setMessage({ type: 'error', text: 'Please enter a genre' });
      return;
    }

    setIsCreating(true);

    try {
      const playlist = await createPlaylist(trimmedGenre);

      const totalSongs = 10;
      const songsPerLang = Math.floor(totalSongs / selectedLanguages.length);
      const remainder = totalSongs % selectedLanguages.length;
      let totalAdded = 0;

      for (let i = 0; i < selectedLanguages.length; i++) {
        const lang = selectedLanguages[i];
        // First language(s) get the extra songs from remainder
        const count = songsPerLang + (i < remainder ? 1 : 0);

        try {
          const songs = await api.searchByGenre(trimmedGenre, count, lang);
          for (const song of songs.slice(0, count)) {
            song.language = lang;
            await addSongToPlaylist(playlist.id, song);
            totalAdded++;
          }
        } catch {
          // Continue with other languages
        }
      }

      const langLabel = selectedLanguages.join(', ');
      if (totalAdded > 0) {
        setMessage({
          type: 'success',
          text: `Playlist "${playlist.name}" created with ${totalAdded} songs (${langLabel})!`,
        });
      } else {
        setMessage({
          type: 'success',
          text: `Playlist "${playlist.name}" created! Use search to add songs.`,
        });
      }

      setGenre('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create playlist' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenreSelect = (selectedGenre: string) => {
    setGenre(selectedGenre);
    setMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreatePlaylist();
    }
  };

  return (
    <div className="playlist-creation-panel">
      <h2>Create Playlist</h2>

      <div className="genre-selection">
        <div className="genre-input-group">
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter genre or select below"
            className="genre-input"
          />
          <button onClick={handleCreatePlaylist} className="create-button" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>

        <div className="common-genres">
          <span className="genres-label">Genre:</span>
          {commonGenres.map((g) => (
            <button
              key={g}
              onClick={() => handleGenreSelect(g)}
              className={`genre-chip ${genre === g ? 'selected' : ''}`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="language-chips">
          <span className="genres-label">Languages:</span>
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              className={`language-chip ${selectedLanguages.includes(lang) ? 'selected' : ''}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};
