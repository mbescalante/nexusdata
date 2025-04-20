import React, { useState } from 'react';
import styles from './Login.module.css';

export default function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes implementar la lógica de autenticación
    if (credentials.username && credentials.password) {
      onLogin(true);
      localStorage.setItem('isAuthenticated', 'true');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h2>NexusData API</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Usuario"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Contraseña"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            />
          </div>
          <button type="submit">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  );
}