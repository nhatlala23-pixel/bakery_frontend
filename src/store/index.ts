import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    _dummy: (state = {}) => state, // Temporary reducer to avoid error
    // Add slices here later, e.g., auth: authReducer, cart: cartReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
