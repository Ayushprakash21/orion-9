import React from 'react';
import { Settings, SettingsSection } from './Settings';

export const Profile = ({ initialTab = 'profile' }: { initialTab?: 'profile' | 'organization' | 'preferences' | 'security' | 'time' }) => {
  const tabToSectionMap: Record<string, SettingsSection> = {
    profile: 'account',
    organization: 'organization',
    preferences: 'appearance',
    time: 'time_region',
    security: 'privacy_security'
  };

  const initialSection = tabToSectionMap[initialTab] || 'account';

  return <Settings initialSection={initialSection} />;
};

export default Profile;
