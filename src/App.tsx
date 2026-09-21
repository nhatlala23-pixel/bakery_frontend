import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store';
import { queryClient } from './lib/react-query';
import { AppRoutes } from './routes/AppRoutes';
import { FloatingSocialWidget } from './components/common/FloatingSocialWidget';

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-brand-light text-brand-dark">
            {/* Header / Navigation can go here */}
            <main>
              <AppRoutes />
            </main>
            {/* Floating Social Contact Widget */}
            <FloatingSocialWidget />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;

