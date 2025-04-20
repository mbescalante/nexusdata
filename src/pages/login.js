import React, { useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './auth.module.css';

export default function Login() {
  const {siteConfig} = useDocusaurusContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica de autenticación
    console.log('Login attempt with:', email, password);
  };

  return (
    <Layout
      title={`Login | ${siteConfig.title}`}
      description="Inicia sesión en NexusData API">
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <Link to="/" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </Link>
          
          <h1 className={styles.authTitle}>Log in to NexusData</h1>
          
          <div className={styles.socialButtons}>
            <button className={styles.socialButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064 5.963 5.963 0 014.262 1.777l2.904-2.897A9.966 9.966 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
              </svg>
              Continue with Google
            </button>
            
            <button className={styles.socialButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              Continue with GitHub
            </button>
            
            <button className={styles.socialButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
              </svg>
              Continue with SSO
            </button>
          </div>
          
          <div className={styles.divider}>
            <span>or</span>
          </div>
          
          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>Email</label>
              <input
                id="email"
                type="email"
                className={styles.formInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>Password</label>
              <div className={styles.passwordInput}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={styles.formInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button 
                  type="button" 
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            <button type="submit" className={styles.submitButton}>
              Log in
            </button>
          </form>
          
          <div className={styles.authFooter}>
            <p>Don't have an account? <Link to="/signup" className={styles.authLink}>Sign up</Link></p>
          </div>
        </div>
      </div>
    </Layout>
  );
}