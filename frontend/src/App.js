import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const result = await axios.post(`${API_URL}/api/travel`, {
        question: question.trim(),
      });

      setResponse(result.data.answer);
    } catch (error) {
      console.error('Error:', error);
      setResponse('Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1 className="title">ViajeIA</h1>
          <p className="subtitle">Tu Asistente Personal de Viajes</p>
        </header>

        <main className="main-content">
          <form onSubmit={handleSubmit} className="form">
            <div className="input-group">
              <textarea
                className="input-field"
                placeholder="¿A dónde quieres viajar? ¿Cuál es tu presupuesto? ¿Qué tipo de actividades te interesan?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows="4"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !question.trim()}
            >
              {loading ? 'Planificando...' : 'Planificar mi viaje'}
            </button>
          </form>

          {response && (
            <div className="response-container">
              <div className="response-header">
                <h2>Tu Plan de Viaje</h2>
              </div>
              <div className="response-content">
                <p>{response}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

