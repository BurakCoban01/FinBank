// FinTrack.API/fintrack-client/src/App.tsx (Önerilen Yapı)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout'; // Bu Layout sadece private yollar için olacak

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AccountsList from './pages/AccountsList';
import AccountForm from './pages/AccountForm'; 
import AccountDetails from './pages/AccountDetails';
import TransactionsList from './pages/TransactionsList';
import TransactionForm from './pages/TransactionForm';
import CategoriesList from './pages/CategoriesList';
import NotFound from './pages/NotFound';

import DepositWithdrawalForm from './pages/DepositWithdrawalForm';
import InvestmentsPage from './pages/InvestmentsPage';
import UserTransferPage from './pages/UserTransferPage';

import TimeDepositPage from './pages/TimeDepositPage';
import LoanPage from './pages/LoanPage';

const theme = createTheme({ palette: {
    primary: {
      main: '#1976d2',  // mavi
    },
    secondary: {
      main: '#f50057',  // kırmızı
    },
  }, });

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Private Routes - Layout ile sarılı */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="accounts" element={<AccountsList />} />
              <Route path="accounts/new" element={<AccountForm />} />
              <Route path="accounts/edit/:accountId" element={<AccountForm />} />
              <Route path="accounts/:accountId" element={<AccountDetails />} /> 
              
              <Route path="transactions" element={<TransactionsList />} />
              <Route path="transactions/new" element={<TransactionForm />} />
              <Route path="transactions/edit/:transactionId" element={<TransactionForm />} />
              
              <Route path="categories" element={<CategoriesList />} />

              <Route path="transfer" element={<DepositWithdrawalForm />} /> 
              <Route path="transfer/:accountId/:operationType" element={<DepositWithdrawalForm />} /> {/* Opsiyonel: Direkt yönlendirme için */}

              <Route path="loans" element={<LoanPage />} />
              <Route path="deposits" element={<TimeDepositPage />} />

              <Route path="investments" element={<InvestmentsPage />} />
              <Route path="user-transfer" element={<UserTransferPage />} /> 
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
