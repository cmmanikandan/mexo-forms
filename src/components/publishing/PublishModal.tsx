import React, { useState } from 'react';
import { Form } from '../../types/forms';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import { MexoInput } from '../common/MexoInput';
import { MexoToggle } from '../common/MexoToggle';
import {
  Calendar, Clock, Globe, Users, Lock, Sparkles, Check, CheckCircle2,
  AlertCircle, MessageSquare, ArrowRight, ShieldCheck, Tag
} from 'lucide-react';

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Form;
  onSavePublishSettings: (updates: Partial<Form>) => Promise<void>;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  open,
  onOpenChange,
  form,
  onSavePublishSettings,
}) => {
  const [publishOption, setPublishOption] = useState<'now' | 'schedule'>(
    form.starts_at && new Date(form.starts_at) > new Date() ? 'schedule' : 'now'
  );

  const [hasEndDate, setHasEndDate] = useState<boolean>(!!form.ends_at);

  const defaultStartDate = form.starts_at ? form.starts_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const defaultStartTime = form.starts_at ? form.starts_at.slice(11, 16) : '09:00';

  const defaultEndDate = form.ends_at ? form.ends_at.slice(0, 10) : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const defaultEndTime = form.ends_at ? form.ends_at.slice(11, 16) : '17:00';

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [startTime, setStartTime] = useState<string>(defaultStartTime);

  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [endTime, setEndTime] = useState<string>(defaultEndTime);

  const [timezone, setTimezone] = useState<string>(form.timezone || 'Asia/Kolkata');

  // Response Limit
  const [hasResponseLimit, setHasResponseLimit] = useState<boolean>(!!(form.response_limit && form.response_limit > 0));
  const [responseLimitCount, setResponseLimitCount] = useState<number>(form.response_limit || 100);
  const [showRemainingCapacity, setShowRemainingCapacity] = useState<boolean>(form.show_remaining_capacity !== false);

  // Closed Message Customization
  const [closedTitle, setClosedTitle] = useState<string>(form.closed_title || 'Registration Closed');
  const [closedMessage, setClosedMessage] = useState<string>(
    form.closed_message || 'Registration for this event has ended. Thank you for your interest.'
  );
  const [closedButtonText, setClosedButtonText] = useState<string>(form.closed_button_text || '');
  const [closedButtonUrl, setClosedButtonUrl] = useState<string>(form.closed_button_url || '');

  // Event Registration Extra Settings
  const [eventName, setEventName] = useState<string>(form.event_name || '');
  const [eventDate, setEventDate] = useState<string>(form.event_date || '');
  const [eventVenue, setEventVenue] = useState<string>(form.event_venue || '');
  const [registrationPrefix, setRegistrationPrefix] = useState<string>(form.registration_prefix || 'MXEV');

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalStartsAt: string | undefined = undefined;
      if (publishOption === 'schedule' && startDate && startTime) {
        finalStartsAt = new Date(`${startDate}T${startTime}:00`).toISOString();
      } else if (publishOption === 'now') {
        finalStartsAt = new Date().toISOString();
      }

      let finalEndsAt: string | undefined = undefined;
      if (hasEndDate && endDate && endTime) {
        finalEndsAt = new Date(`${endDate}T${endTime}:00`).toISOString();
      }

      const updates: Partial<Form> = {
        is_published: true,
        status: publishOption === 'schedule' && finalStartsAt && new Date(finalStartsAt) > new Date() ? 'published' : 'published',
        accepting_responses: true,
        manual_closed_at: undefined,
        paused_at: undefined,
        starts_at: finalStartsAt,
        ends_at: finalEndsAt,
        timezone,
        response_limit: hasResponseLimit ? Math.max(1, responseLimitCount) : undefined,
        show_remaining_capacity: showRemainingCapacity,
        closed_title: closedTitle.trim() || 'Registration Closed',
        closed_message: closedMessage.trim() || 'This form is no longer accepting responses.',
        closed_button_text: closedButtonText.trim() || undefined,
        closed_button_url: closedButtonUrl.trim() || undefined,
        event_name: eventName.trim() || undefined,
        event_date: eventDate.trim() || undefined,
        event_venue: eventVenue.trim() || undefined,
        registration_prefix: registrationPrefix.trim().toUpperCase() || 'MXEV',
      };

      await onSavePublishSettings(updates);
      onOpenChange(false);
    } catch (err) {
      console.error('[PUBLISH] Error updating publishing settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MexoModal
      open={open}
      onOpenChange={onOpenChange}
      title="Publishing & Availability Settings"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* 1. PUBLISH MODE CHOICE */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-app-heading uppercase tracking-wider">
            1. Availability Schedule
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPublishOption('now')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                publishOption === 'now'
                  ? 'border-[#7C3AED] bg-indigo-50/70 text-[#7C3AED] shadow-2xs'
                  : 'border-app-border bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Publish Now
                </span>
                {publishOption === 'now' && <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />}
              </div>
              <p className="text-[11px] text-app-muted">Starts accepting responses immediately upon publishing.</p>
            </button>

            <button
              type="button"
              onClick={() => setPublishOption('schedule')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                publishOption === 'schedule'
                  ? 'border-[#7C3AED] bg-indigo-50/70 text-[#7C3AED] shadow-2xs'
                  : 'border-app-border bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Schedule for Later
                </span>
                {publishOption === 'schedule' && <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />}
              </div>
              <p className="text-[11px] text-app-muted">Opens automatically at a scheduled start date & time.</p>
            </button>
          </div>
        </div>

        {/* Start Date / Time inputs if Schedule */}
        {publishOption === 'schedule' && (
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <h4 className="text-xs font-extrabold text-app-heading flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#7C3AED]" /> Start Date & Time
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-app-muted mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold text-app-heading bg-white outline-none focus:border-[#7C3AED]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-app-muted mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold text-app-heading bg-white outline-none focus:border-[#7C3AED]"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. END DATE & TIME */}
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-app-heading">Set Deadline / End Date</label>
              <p className="text-[11px] text-app-muted">Form automatically closes after the deadline passes.</p>
            </div>
            <MexoToggle
              id="toggle-end-date"
              checked={hasEndDate}
              onCheckedChange={setHasEndDate}
            />
          </div>

          {hasEndDate && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-app-border space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-app-muted mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold text-app-heading bg-white outline-none focus:border-[#7C3AED]"
                    required={hasEndDate}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-app-muted mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold text-app-heading bg-white outline-none focus:border-[#7C3AED]"
                    required={hasEndDate}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-app-muted mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#7C3AED]" /> Timezone
                </label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold text-app-heading bg-white outline-none focus:border-[#7C3AED]"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST • UTC+5:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST • UTC-5)</option>
                  <option value="Europe/London">Europe/London (GMT • UTC+0)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 3. RESPONSE CAPACITY LIMIT */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-app-heading flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#7C3AED]" /> Maximum Response Limit / Capacity
              </label>
              <p className="text-[11px] text-app-muted">Useful for workshops, events and limited seats (e.g. 100 spots).</p>
            </div>
            <MexoToggle
              id="toggle-response-limit"
              checked={hasResponseLimit}
              onCheckedChange={setHasResponseLimit}
            />
          </div>

          {hasResponseLimit && (
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-app-heading mb-1">Maximum Seats / Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={responseLimitCount}
                  onChange={e => setResponseLimitCount(Number(e.target.value))}
                  placeholder="e.g. 100"
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-bold text-app-heading bg-white outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-app-heading">Show remaining spots to respondents</span>
                <MexoToggle
                  id="toggle-remaining-capacity"
                  checked={showRemainingCapacity}
                  onCheckedChange={setShowRemainingCapacity}
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. CUSTOM AFTER-CLOSING MESSAGE */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-app-heading uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#7C3AED]" /> Custom Closed Page Screen
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-app-heading mb-1">Closed Title</label>
              <MexoInput
                value={closedTitle}
                onChange={e => setClosedTitle(e.target.value)}
                placeholder="Registration Closed"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-app-heading mb-1">Closed Message</label>
              <textarea
                value={closedMessage}
                onChange={e => setClosedMessage(e.target.value)}
                placeholder="Registration for this event has ended. Thank you for your interest."
                rows={2}
                className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-medium text-app-heading bg-white outline-none focus:border-[#7C3AED] resize-y"
              />
            </div>
          </div>
        </div>

        {/* 5. EVENT REGISTRATION METADATA */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-app-heading uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#7C3AED]" /> Event Details & Registration ID Prefix
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-app-heading mb-1">Event Venue / Location</label>
              <MexoInput
                value={eventVenue}
                onChange={e => setEventVenue(e.target.value)}
                placeholder="Main Auditorium / Online"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-app-heading mb-1">Registration Prefix</label>
              <MexoInput
                value={registrationPrefix}
                onChange={e => setRegistrationPrefix(e.target.value)}
                placeholder="MXEV"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-app-body hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <MexoButton
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
          >
            Save & Publish Form
          </MexoButton>
        </div>
      </form>
    </MexoModal>
  );
};
