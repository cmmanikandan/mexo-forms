import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoEmptyState } from '../../components/common/MexoSkeleton';
import { Share2 } from 'lucide-react';

export const SharedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading mb-6 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#7C3AED]" /> Shared with me
        </h1>
        <MexoEmptyState
          icon={<Share2 className="w-8 h-8 text-app-muted" />}
          title="No shared forms yet"
          description="Forms shared with you by other MEXO Account users will appear here."
          action={
            <MexoButton variant="secondary" size="sm" onClick={() => navigate('/forms')}>
              View My Forms
            </MexoButton>
          }
        />
      </div>
    </AppShell>
  );
};
