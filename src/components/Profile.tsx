import React from 'react';
import { Settings, SettingsSection } from './Settings';

export const Profile = ({ initialTab = 'profile' }: { initialTab?: 'profile' | 'organization' | 'preferences' | 'security' | 'time' | 'language' }) => {
  const tabToSectionMap: Record<string, SettingsSection> = {
    profile: 'account',
    organization: 'organization',
    preferences: 'appearance',
    language: 'language_region',
    time: 'time_date',
    security: 'privacy_security'
  };

  const initialSection = tabToSectionMap[initialTab] || 'account';

  return <Settings initialSection={initialSection} />;
};

export default Profile;
