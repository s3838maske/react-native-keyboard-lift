import { registerRootComponent } from 'expo';

import App from './App';

// Registers the root component and sets up the environment for both Expo Go
// and a native build. Pointing `main` straight at App.tsx skips this and the
// app fails at runtime with "main has not been registered".
registerRootComponent(App);
