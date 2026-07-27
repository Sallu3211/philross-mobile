declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  
  const content: React.FC<SvgProps & { width?: number; height?: number }>;
  export default content;
}


