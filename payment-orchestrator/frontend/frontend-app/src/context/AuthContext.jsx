import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Demo users for local dev — replace with real JWT/session auth when backend is wired up
const DEMO_USERS = [
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Shubham', email: 'shubham@demo.com', password: 'pass', role: 'USER'    },
  { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', name: 'Rajan',   email: 'rajan@demo.com',   password: 'pass', role: 'ADMIN'   },
  { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', name: 'Sammy',   email: 'sammy@demo.com',   password: 'pass', role: 'AUDITOR' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  function login(email, password) {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      setError('');
      return true;
    }
    setError('Invalid email or password.');
    return false;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
