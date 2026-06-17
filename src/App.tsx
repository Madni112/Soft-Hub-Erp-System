import { Toaster } from 'react-hot-toast';
import Navigation from './Navigation/Routing';
import { ModalProvider } from './Context/Modal';
import { useEffect } from 'react';
import { initializeSocket } from './service/socket';
import { AuthProvider } from './Context/Auth';
import Alert from './pages/Alert';

function App() {
  useEffect(() => {
    initializeSocket();
  }, []);
  return (
    <AuthProvider>
      <ModalProvider>
        <Navigation />
        <Toaster 
         toastOptions={{
        duration: 1500, }}  />
        <Alert />
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
