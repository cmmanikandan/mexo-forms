import React from 'react';
import { PublishModal as PublishingPublishModal } from '../publishing/PublishModal';
import { Form } from '../../types/forms';

interface PublishModalProps {
  open: boolean;
  form: Form;
  onClose: () => void;
  onPublished: (form: Form) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ open, form, onClose, onPublished }) => {
  return (
    <PublishingPublishModal
      open={open}
      onOpenChange={(op) => { if (!op) onClose(); }}
      form={form}
      onSavePublishSettings={async (updates: Partial<Form>) => {
        onPublished({ ...form, ...updates, is_published: true, status: 'published' });
      }}
    />
  );
};
