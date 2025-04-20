import React, { useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './auth.module.css';

export default function Signup() {
  const {siteConfig} = useDocusaurusContext();
  const [activeTab, setActiveTab] = useState('work');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica de registro
    console.log('Signup attempt with:', {
      email,
      password,
      firstName,
      lastName,
      organization,
      accountType: activeTab
    });
  };

  return (
    <Layout
      title={`Sign Up | ${siteConfig.title}`}
      description="Regístrate en NexusData API">
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <Link to="/" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </Link>
          
          <h1 className={styles.authTitle}>Sign up for NexusData</h1>
          
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'work' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('work')}
            >
              Work Email
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'personal' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Use
            </button>
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
                  placeholder="Create a password"
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
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.formLabel}>Confirm Password</label>
              <div className={styles.passwordInput}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={styles.formInput}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
                <button 
                  type="button" 
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Profile Info</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="firstName" className={styles.formLabel}>First Name</label>
                <input
                  id="firstName"
                  type="text"
                  className={styles.formInput}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="lastName" className={styles.formLabel}>Last Name (optional)</label>
                <input
                  id="lastName"
                  type="text"
                  className={styles.formInput}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="organization" className={styles.formLabel}>Organization (optional)</label>
                <input
                  id="organization"
                  type="text"
                  className={styles.formInput}
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Enter your organization"
                />
              </div>
            </div>
            
            <div className={styles.termsContainer}>
              <p className={styles.termsText}>
                By registering, I agree to the <Link to="/terms" className={styles.termsLink}>Terms of Service</Link> and <Link to="/privacy" className={styles.termsLink}>Privacy Policy</Link>
              </p>
            </div>
            
            <button type="submit" className={styles.submitButton}>
              Register
            </button>
          </form>
          
          <div className={styles.authFooter}>
            <p>Already have an account? <Link to="/login" className={styles.authLink}>Log in</Link></p>
          </div>
        </div>
      </div>
    </Layout>
  );
}