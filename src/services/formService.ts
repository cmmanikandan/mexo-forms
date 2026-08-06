import { supabase } from '../lib/supabase';
import { Form, FormSection, FormQuestion, FormOption, FormStatus } from '../types/forms';

export const formService = {
  // =============================================
  // FORMS CRUD
  // =============================================
  async createForm(userId: string, title: string = 'Untitled Form'): Promise<Form | null> {
    const { data: sessionData } = await supabase.auth.getSession();
    const activeUserId = sessionData.session?.user?.id || userId;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('forms')
      .insert({
        owner_id: activeUserId,
        title,
        slug,
        status: 'draft',
        form_type: 'form',
      })
      .select('*')
      .single();
    if (error) { console.error('createForm error:', error); return null; }
    return data as Form;
  },

  async getForm(formId: string): Promise<Form | null> {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();
    if (error || !data) return null;
    return data as Form;
  },

  async getFormBySlug(slug: string): Promise<Form | null> {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error || !data) return null;
    return data as Form;
  },

  async getUserForms(userId: string): Promise<Form[]> {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('owner_id', userId)
      .neq('status', 'trashed')
      .order('updated_at', { ascending: false });
    if (error) return [];
    // Get response counts
    const forms = (data as Form[]) || [];
    const counts = await Promise.all(
      forms.map(f => supabase.rpc('get_form_response_count', { p_form_id: f.id }))
    );
    return forms.map((f, i) => ({ ...f, response_count: counts[i].data || 0 }));
  },

  async getStarredForms(userId: string): Promise<Form[]> {
    const { data } = await supabase
      .from('forms')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_starred', true)
      .neq('status', 'trashed')
      .order('updated_at', { ascending: false });
    return (data as Form[]) || [];
  },

  async getTrashedForms(userId: string): Promise<Form[]> {
    const { data } = await supabase
      .from('forms')
      .select('*')
      .eq('owner_id', userId)
      .eq('status', 'trashed')
      .order('updated_at', { ascending: false });
    return (data as Form[]) || [];
  },

  async updateForm(formId: string, updates: Partial<Form>): Promise<Form | null> {
    const { data, error } = await supabase
      .from('forms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', formId)
      .select('*')
      .single();
    if (error) { console.error('updateForm error:', error); return null; }
    return data as Form;
  },

  async publishForm(formId: string): Promise<Form | null> {
    return formService.updateForm(formId, { status: 'published', is_published: true });
  },

  async closeForm(formId: string): Promise<Form | null> {
    return formService.updateForm(formId, { status: 'closed', accepting_responses: false });
  },

  async trashForm(formId: string): Promise<void> {
    await supabase.from('forms').update({ status: 'trashed' }).eq('id', formId);
  },

  async restoreForm(formId: string): Promise<void> {
    await supabase.from('forms').update({ status: 'draft' }).eq('id', formId);
  },

  async deleteFormPermanently(formId: string): Promise<void> {
    await supabase.from('forms').delete().eq('id', formId);
  },

  async toggleStar(formId: string, starred: boolean): Promise<void> {
    await supabase.from('forms').update({ is_starred: starred }).eq('id', formId);
  },

  async duplicateForm(form: Form, userId: string): Promise<Form | null> {
    const newSlug = `${form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-copy-${Date.now().toString(36)}`;
    const { data: newForm, error } = await supabase
      .from('forms')
      .insert({
        owner_id: userId,
        title: `${form.title} (Copy)`,
        description: form.description,
        slug: newSlug,
        status: 'draft',
        form_type: form.form_type,
        is_published: false,
        accepting_responses: true,
        requires_login: form.requires_login,
        one_response_per_user: form.one_response_per_user,
        confirmation_message: form.confirmation_message,
      })
      .select('*')
      .single();
    if (error || !newForm) return null;

    // Copy questions and options
    const questions = await formService.getQuestions(form.id);
    for (const q of questions) {
      const { data: newQ } = await supabase
        .from('form_questions')
        .insert({
          form_id: (newForm as Form).id,
          question_text: q.question_text,
          description: q.description,
          question_type: q.question_type,
          required: q.required,
          position: q.position,
          settings: q.settings,
        })
        .select('*')
        .single();
      if (newQ && q.options && q.options.length > 0) {
        await supabase.from('form_options').insert(
          q.options.map(o => ({
            question_id: (newQ as FormQuestion).id,
            label: o.label,
            value: o.value,
            is_correct: o.is_correct,
            points: o.points,
            position: o.position,
          }))
        );
      }
    }
    return newForm as Form;
  },

  // =============================================
  // SECTIONS
  // =============================================
  async getSections(formId: string): Promise<FormSection[]> {
    const { data } = await supabase
      .from('form_sections')
      .select('*')
      .eq('form_id', formId)
      .order('position');
    return (data as FormSection[]) || [];
  },

  async createSection(formId: string, title: string, position: number): Promise<FormSection | null> {
    const { data, error } = await supabase
      .from('form_sections')
      .insert({ form_id: formId, title, position })
      .select('*')
      .single();
    if (error) return null;
    return data as FormSection;
  },

  async updateSection(sectionId: string, updates: Partial<FormSection>): Promise<void> {
    await supabase.from('form_sections').update(updates).eq('id', sectionId);
  },

  async deleteSection(sectionId: string): Promise<void> {
    await supabase.from('form_sections').delete().eq('id', sectionId);
  },

  // =============================================
  // QUESTIONS
  // =============================================
  async getQuestions(formId: string): Promise<FormQuestion[]> {
    const { data: questions } = await supabase
      .from('form_questions')
      .select('*')
      .eq('form_id', formId)
      .order('position');
    if (!questions) return [];

    const { data: options } = await supabase
      .from('form_options')
      .select('*')
      .in('question_id', questions.map(q => q.id))
      .order('position');

    return (questions as FormQuestion[]).map(q => ({
      ...q,
      options: (options as FormOption[] || []).filter(o => o.question_id === q.id),
    }));
  },

  async addQuestion(formId: string, questionType: string, position: number): Promise<FormQuestion | null> {
    const defaults = getQuestionDefaults(questionType);
    const { data, error } = await supabase
      .from('form_questions')
      .insert({
        form_id: formId,
        question_text: defaults.question_text,
        question_type: questionType,
        required: false,
        position,
        settings: defaults.settings,
      })
      .select('*')
      .single();
    if (error) { console.error('addQuestion error:', error); return null; }

    const question = data as FormQuestion;

    // Add default options for choice questions
    if (['multiple_choice', 'checkbox', 'dropdown'].includes(questionType)) {
      const { data: opts } = await supabase
        .from('form_options')
        .insert([
          { question_id: question.id, label: 'Option 1', value: 'option_1', position: 0 },
          { question_id: question.id, label: 'Option 2', value: 'option_2', position: 1 },
        ])
        .select('*');
      question.options = (opts as FormOption[]) || [];
    } else {
      question.options = [];
    }

    return question;
  },

  async updateQuestion(questionId: string, updates: Partial<FormQuestion>): Promise<void> {
    const { options: _, ...rest } = updates;
    await supabase.from('form_questions').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', questionId);
  },

  async deleteQuestion(questionId: string): Promise<void> {
    await supabase.from('form_questions').delete().eq('id', questionId);
  },

  async reorderQuestions(questions: { id: string; position: number }[]): Promise<void> {
    await Promise.all(
      questions.map(q => supabase.from('form_questions').update({ position: q.position }).eq('id', q.id))
    );
  },

  async duplicateQuestion(question: FormQuestion): Promise<FormQuestion | null> {
    const { data, error } = await supabase
      .from('form_questions')
      .insert({
        form_id: question.form_id,
        section_id: question.section_id,
        question_text: question.question_text,
        description: question.description,
        question_type: question.question_type,
        required: question.required,
        position: question.position + 1,
        settings: question.settings,
      })
      .select('*')
      .single();
    if (error || !data) return null;
    const newQ = data as FormQuestion;
    if (question.options && question.options.length > 0) {
      const { data: opts } = await supabase
        .from('form_options')
        .insert(question.options.map(o => ({
          question_id: newQ.id,
          label: o.label,
          value: o.value,
          is_correct: o.is_correct,
          points: o.points,
          position: o.position,
        })))
        .select('*');
      newQ.options = (opts as FormOption[]) || [];
    }
    return newQ;
  },

  // =============================================
  // OPTIONS
  // =============================================
  async addOption(questionId: string, label: string, position: number): Promise<FormOption | null> {
    const { data, error } = await supabase
      .from('form_options')
      .insert({ question_id: questionId, label, value: label.toLowerCase().replace(/\s+/g, '_'), position })
      .select('*')
      .single();
    if (error) return null;
    return data as FormOption;
  },

  async updateOption(optionId: string, updates: Partial<FormOption>): Promise<void> {
    await supabase.from('form_options').update(updates).eq('id', optionId);
  },

  async deleteOption(optionId: string): Promise<void> {
    await supabase.from('form_options').delete().eq('id', optionId);
  },

  // =============================================
  // SEARCH
  // =============================================
  async searchForms(userId: string, query: string): Promise<Form[]> {
    const { data } = await supabase
      .from('forms')
      .select('*')
      .eq('owner_id', userId)
      .neq('status', 'trashed')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false });
    return (data as Form[]) || [];
  },
};

function getQuestionDefaults(type: string): { question_text: string; settings: Record<string, any> } {
  const defaults: Record<string, { question_text: string; settings: Record<string, any> }> = {
    short_text: { question_text: 'Short answer question', settings: {} },
    long_text: { question_text: 'Long answer question', settings: {} },
    email: { question_text: 'Email address', settings: {} },
    phone: { question_text: 'Phone number', settings: {} },
    number: { question_text: 'Number', settings: { min: null, max: null } },
    multiple_choice: { question_text: 'Multiple choice question', settings: {} },
    checkbox: { question_text: 'Checkbox question', settings: {} },
    dropdown: { question_text: 'Dropdown question', settings: {} },
    yes_no: { question_text: 'Yes / No question', settings: {} },
    rating: { question_text: 'Rating question', settings: { max_rating: 5, style: 'stars' } },
    linear_scale: { question_text: 'Linear scale question', settings: { min: 1, max: 10, min_label: '', max_label: '' } },
    date: { question_text: 'Date', settings: {} },
    time: { question_text: 'Time', settings: {} },
  };
  return defaults[type] || { question_text: 'Question', settings: {} };
}
