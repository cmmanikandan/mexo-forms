import React from 'react';
import { useLocation } from 'react-router-dom';
import { AccountSettingsLayout } from '../../components/layout/AccountSettingsLayout';
import { AccountNavigation } from '../../components/account/AccountNavigation';
import { OverviewView } from './views/OverviewView';
import { PersonalInfoView } from './views/PersonalInfoView';
import { SecurityView } from './views/SecurityView';
import { DevicesView } from './views/DevicesView';
import { RecoveryView } from './views/RecoveryView';
import { ConnectedAppsView } from './views/ConnectedAppsView';
import { PrivacyView } from './views/PrivacyView';
import { StorageView } from './views/StorageView';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const AccountPage: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isPersonal = currentPath.includes('/personal-info');
  const isSecurity = currentPath.includes('/security');
  const isSessions = currentPath.includes('/devices');
  const isRecovery = currentPath.includes('/recovery');
  const isApps = currentPath.includes('/connected-apps');
  const isPrivacy = currentPath.includes('/privacy');
  const isStorage = currentPath.includes('/storage');

  const getSubpageTitle = () => {
    if (isPersonal) return 'Personal info';
    if (isSecurity) return 'Security';
    if (isSessions) return 'Devices & sessions';
    if (isRecovery) return 'Recovery';
    if (isApps) return 'Connected MEXO Apps';
    if (isPrivacy) return 'Privacy';
    if (isStorage) return 'Data & Storage';
    return 'MEXO Account';
  };

  const title = getSubpageTitle();
  useDocumentTitle(`${title} — MEXO Account`);

  const renderContent = () => {
    if (isPersonal) return <PersonalInfoView />;
    if (isSecurity) return <SecurityView />;
    if (isSessions) return <DevicesView />;
    if (isRecovery) return <RecoveryView />;
    if (isApps) return <ConnectedAppsView />;
    if (isPrivacy) return <PrivacyView />;
    if (isStorage) return <StorageView />;
    return <OverviewView />;
  };

  return (
    <AccountSettingsLayout
      title={title}
      subtitle="Identity & Security Hub"
      sidebar={<AccountNavigation />}
      mobileBackPath="/home"
    >
      {renderContent()}
    </AccountSettingsLayout>
  );
};
