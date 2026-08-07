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
  const currentPath = location.pathname.toLowerCase();

  const isPersonal = currentPath.includes('/personal');
  const isSecurity = currentPath.includes('/security');
  const isSessions = currentPath.includes('/devices') || currentPath.includes('/sessions');
  const isRecovery = currentPath.includes('/recovery');
  const isApps = currentPath.includes('/apps') || currentPath.includes('/connected-apps');
  const isPrivacy = currentPath.includes('/privacy');
  const isStorage = currentPath.includes('/storage');

  const isSubpage = isPersonal || isSecurity || isSessions || isRecovery || isApps || isPrivacy || isStorage;

  const getSubpageMeta = () => {
    if (isPersonal) return { title: 'Personal Information', subtitle: 'Name, photo and personal data' };
    if (isSecurity) return { title: 'Security', subtitle: 'Password and authentication' };
    if (isSessions) return { title: 'Devices & Sessions', subtitle: 'Manage signed-in devices' };
    if (isRecovery) return { title: 'Recovery', subtitle: 'Recovery email and options' };
    if (isApps) return { title: 'Connected MEXO Apps', subtitle: 'Apps connected to account' };
    if (isPrivacy) return { title: 'Privacy', subtitle: 'Privacy controls and activity' };
    if (isStorage) return { title: 'Data & Storage', subtitle: 'Storage usage and data' };
    return { title: 'MEXO Account', subtitle: 'Identity & Security Hub' };
  };

  const { title, subtitle } = getSubpageMeta();
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
      subtitle={subtitle}
      sidebar={<AccountNavigation />}
      mobileBackPath={isSubpage ? '/account' : '/settings'}
    >
      {renderContent()}
    </AccountSettingsLayout>
  );
};
