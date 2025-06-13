import { useState } from 'react';
import '../styles/CharacterSelect.css';

const CharacterSelect = ({ onStartGame }) => {
  const [username, setUsername] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const characters = [
    { id: 1, name: 'Sari', image: '/assets/player1-front.png', description: 'Penjelajah Pantai' },
    { id: 2, name: 'Bayu', image: '/assets/player2-front.png', description: 'Petualang Hutan' },
    { id: 3, name: 'Dewi', image: '/assets/player3-front.png', description: 'Peneliti Budaya' },
    { id: 4, name: 'Ardi', image: '/assets/player4-front.png', description: 'Pemandu Wisata' },
    { id: 5, name: 'Maya', image: '/assets/player5-front.png', description: 'Fotografer Alam' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && selectedCharacter) {
      onStartGame({ username, character: selectedCharacter });
    }
  };

  return (
    <div className="character-select">
      <div className="character-select-header">
        <h2>🏝️ UCUP MENJELAJAH NUSANTARA 🏝️</h2>
        <h3>Pilih Karakter Petualanganmu</h3>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="username-input">
          <label htmlFor="username">Nama Petualang:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan namamu..."
            required
          />
        </div>
        
        <div className="character-grid">
          {characters.map((char) => (
            <div
              key={char.id}
              className={`character-card ${selectedCharacter?.id === char.id ? 'selected' : ''}`}
              onClick={() => setSelectedCharacter(char)}
            >
              <div className="character-image">
                <img src={char.image} alt={char.name} />
              </div>
              <div className="character-info">
                <h4>{char.name}</h4>
                <p className="character-role">{char.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          type="submit" 
          className="start-button"
          disabled={!username.trim() || !selectedCharacter}
        >
          🚀 Mulai Petualangan! 🚀
        </button>
      </form>
    </div>
  );
};

export default CharacterSelect; 