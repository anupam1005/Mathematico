declare module 'react' {
  export function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prevState: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export type ReactNode = any;
  const React: any;
  export = React;
  export as namespace React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-native-gesture-handler' {
  export interface GestureHandlerRootViewProps {
    style?: any;
    children?: any;
  }
  export const GestureHandlerRootView: any;
}