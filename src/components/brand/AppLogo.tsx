import React from 'react';
import { BrandLogo, BrandLogoProps } from './BrandLogo';

export type AppLogoProps = BrandLogoProps;

export const AppLogo: React.FC<AppLogoProps> = (props) => {
  return <BrandLogo {...props} />;
};
