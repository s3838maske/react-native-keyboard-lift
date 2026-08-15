import type { ComponentType } from 'react';

import { BasicForm } from './BasicForm';
import { BottomActionButton } from './BottomActionButton';
import { FlatListForm } from './FlatListForm';
import { LoginForm } from './LoginForm';
import { LongForm } from './LongForm';
import { ModalForm } from './ModalForm';
import { NestedScroll } from './NestedScroll';
import { RegistrationForm } from './RegistrationForm';
import { SafeAreaScreen } from './SafeAreaScreen';
import { StressTest } from './StressTest';

export interface Screen {
  key: string;
  title: string;
  subtitle: string;
  component: ComponentType;
}

export const SCREENS: Screen[] = [
  {
    key: 'basic',
    title: 'Basic form',
    subtitle: 'Zero configuration',
    component: BasicForm,
  },
  {
    key: 'long',
    title: 'Long form',
    subtitle: 'First and last field behaviour',
    component: LongForm,
  },
  {
    key: 'login',
    title: 'Login form',
    subtitle: 'KeyboardAvoider, no scrolling',
    component: LoginForm,
  },
  {
    key: 'registration',
    title: 'Registration form',
    subtitle: 'Content height changes while open',
    component: RegistrationForm,
  },
  {
    key: 'flatlist',
    title: 'FlatList form',
    subtitle: 'Virtualised inputs with header and footer',
    component: FlatListForm,
  },
  {
    key: 'modal',
    title: 'Modal form',
    subtitle: 'Opened while the keyboard is already up',
    component: ModalForm,
  },
  {
    key: 'footer',
    title: 'Bottom action button',
    subtitle: 'Pinned Continue button',
    component: BottomActionButton,
  },
  {
    key: 'nested',
    title: 'Nested scroll containers',
    subtitle: 'Inner scrollers keep working',
    component: NestedScroll,
  },
  {
    key: 'safearea',
    title: 'Safe area & metrics',
    subtitle: 'Live geometry readout',
    component: SafeAreaScreen,
  },
  {
    key: 'stress',
    title: 'Stress test',
    subtitle: 'Rapid focus changes, 40 fields',
    component: StressTest,
  },
];
