import { Form, FormLifecycleStatus } from '../types/forms';

export interface FormAvailabilityResult {
  status: FormLifecycleStatus;
  reason:
    | 'NOT_PUBLISHED'
    | 'NOT_STARTED'
    | 'MANUAL_CLOSE'
    | 'PAUSED'
    | 'END_TIME_REACHED'
    | 'RESPONSE_LIMIT_REACHED'
    | 'OPEN'
    | 'DRAFT';
  canSubmit: boolean;
  badgeLabel: string;
  badgeColorClass: string;
  closedTitle: string;
  closedMessage: string;
  formattedStartDate?: string;
  formattedEndDate?: string;
  remainingCapacity?: number;
  totalCapacity?: number;
  currentResponseCount: number;
}

/**
 * Calculates authoritative form availability status & messages based on form parameters
 * and active server/client time.
 */
export function getFormAvailability(
  form: Form,
  currentResponseCount: number = 0,
): FormAvailabilityResult {
  const now = new Date();
  const respCount = currentResponseCount || form.response_count || 0;

  // Single source of truth for form mode
  const formMode = (form as any).form_mode ?? (form.form_type === 'quiz' ? 'quiz' : 'standard');
  const isRegistration = formMode === 'registration';
  const isQuiz = formMode === 'quiz';

  const totalCap = isRegistration && form.response_limit && form.response_limit > 0 ? form.response_limit : undefined;
  const remainingCap = totalCap !== undefined ? Math.max(0, totalCap - respCount) : undefined;

  const formatDateStr = (isoString?: string | null) => {
    if (!isoString) return undefined;
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  const formattedStart = formatDateStr(form.starts_at);
  const formattedEnd = formatDateStr(form.ends_at);

  const resolveClosedTitle = (defaultTitle: string) => {
    if (isRegistration) {
      return form.closed_title || defaultTitle;
    }
    if (isQuiz) {
      return 'Assessment Closed';
    }
    // Standard mode: ignore stored 'Registration Closed' strings
    if (form.closed_title && !form.closed_title.toLowerCase().includes('registration')) {
      return form.closed_title;
    }
    return defaultTitle;
  };

  const resolveClosedMessage = (defaultMessage: string) => {
    if (isRegistration) {
      return form.closed_message || defaultMessage;
    }
    if (isQuiz) {
      return 'This assessment is no longer accepting responses.';
    }
    if (form.closed_message && !form.closed_message.toLowerCase().includes('event')) {
      return form.closed_message;
    }
    return defaultMessage;
  };

  // 1. Check if draft or not published
  if (!form.is_published || form.status === 'draft') {
    return {
      status: 'DRAFT',
      reason: 'NOT_PUBLISHED',
      canSubmit: false,
      badgeLabel: 'DRAFT',
      badgeColorClass: 'bg-slate-100 text-slate-700 border-slate-200',
      closedTitle: isQuiz ? 'Assessment Draft' : (isRegistration ? 'Registration Draft' : 'Form Draft'),
      closedMessage: 'This form is currently a draft and has not been published by the owner.',
      currentResponseCount: respCount,
    };
  }

  // 2. Check if archived
  if (form.status === 'archived' || form.status === 'trashed') {
    return {
      status: 'ARCHIVED',
      reason: 'MANUAL_CLOSE',
      canSubmit: false,
      badgeLabel: 'ARCHIVED',
      badgeColorClass: 'bg-slate-100 text-slate-600 border-slate-200',
      closedTitle: isQuiz ? 'Assessment Archived' : (isRegistration ? 'Registration Archived' : 'Form Archived'),
      closedMessage: 'This form has been archived and is no longer accepting responses.',
      currentResponseCount: respCount,
    };
  }

  // 3. Check if paused by owner
  if (form.paused_at || (form.status as string) === 'paused') {
    return {
      status: 'PAUSED',
      reason: 'PAUSED',
      canSubmit: false,
      badgeLabel: 'PAUSED',
      badgeColorClass: 'bg-amber-100 text-amber-800 border-amber-200',
      closedTitle: resolveClosedTitle('Temporarily Unavailable'),
      closedMessage: resolveClosedMessage('The owner has temporarily paused responses. Please check back later.'),
      currentResponseCount: respCount,
    };
  }

  // 4. Check if manually closed by owner or status === 'closed'
  if (form.manual_closed_at || form.status === 'closed' || !form.accepting_responses) {
    return {
      status: 'CLOSED',
      reason: 'MANUAL_CLOSE',
      canSubmit: false,
      badgeLabel: 'CLOSED',
      badgeColorClass: 'bg-rose-100 text-rose-800 border-rose-200',
      closedTitle: resolveClosedTitle(isRegistration ? 'Registration Closed' : 'Form Closed'),
      closedMessage: resolveClosedMessage(isRegistration ? 'Registration for this event has ended.' : 'This form is no longer accepting responses.'),
      currentResponseCount: respCount,
    };
  }

  // 5. Check if scheduled for start date in future
  if (form.starts_at && now < new Date(form.starts_at)) {
    return {
      status: 'SCHEDULED',
      reason: 'NOT_STARTED',
      canSubmit: false,
      badgeLabel: 'SCHEDULED',
      badgeColorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      closedTitle: resolveClosedTitle(isRegistration ? 'Registration Opens Soon' : 'Form Opens Soon'),
      closedMessage: resolveClosedMessage(isRegistration ? `Registration opens on ${formattedStart || form.starts_at}.` : `This form will start accepting responses on ${formattedStart || form.starts_at}.`),
      formattedStartDate: formattedStart,
      formattedEndDate: formattedEnd,
      currentResponseCount: respCount,
    };
  }

  // 6. Check if end date reached
  if (form.ends_at && now >= new Date(form.ends_at)) {
    return {
      status: 'CLOSED',
      reason: 'END_TIME_REACHED',
      canSubmit: false,
      badgeLabel: 'CLOSED',
      badgeColorClass: 'bg-rose-100 text-rose-800 border-rose-200',
      closedTitle: resolveClosedTitle(isRegistration ? 'Registration Closed' : 'Form Closed'),
      closedMessage: resolveClosedMessage(isRegistration ? `Registration ended on ${formattedEnd || form.ends_at}.` : `The response deadline passed on ${formattedEnd || form.ends_at}.`),
      formattedStartDate: formattedStart,
      formattedEndDate: formattedEnd,
      currentResponseCount: respCount,
    };
  }

  // 7. Check if response limit capacity reached (REGISTRATION MODE ONLY)
  if (isRegistration && totalCap !== undefined && respCount >= totalCap) {
    return {
      status: 'FULL',
      reason: 'RESPONSE_LIMIT_REACHED',
      canSubmit: false,
      badgeLabel: 'FULL',
      badgeColorClass: 'bg-purple-100 text-purple-800 border-purple-200',
      closedTitle: form.closed_title || 'Registration Full',
      closedMessage: form.closed_message || `All ${totalCap} available spots for this event have been filled.`,
      remainingCapacity: 0,
      totalCapacity: totalCap,
      currentResponseCount: respCount,
    };
  }

  // 8. Otherwise OPEN
  return {
    status: 'OPEN',
    reason: 'OPEN',
    canSubmit: true,
    badgeLabel: 'OPEN',
    badgeColorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    closedTitle: 'Form Open',
    closedMessage: 'Accepting responses.',
    formattedStartDate: formattedStart,
    formattedEndDate: formattedEnd,
    remainingCapacity: remainingCap,
    totalCapacity: totalCap,
    currentResponseCount: respCount,
  };
}
