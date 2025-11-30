import { useState } from 'react';
import { useCreateInteraction } from '../api/interactions';
import { INTERACTION_TYPE_OPTIONS } from '../api/types';
import { InlineEditableTextarea, InlineEditableSelect, InlineEditableDate, InlineEditableTime } from './ui';
import type { InteractionType } from '../api/types';

interface NewInteractionRowProps {
  contactId: number;
  variant?: 'detail' | 'card';
  onCreated?: () => void;
}

export default function NewInteractionRow({ contactId, variant = 'detail', onCreated }: NewInteractionRowProps) {
  const createInteraction = useCreateInteraction();
  
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);
  
  const [type, setType] = useState<InteractionType>('call');
  const [date, setDate] = useState<string>(today);
  const [time, setTime] = useState<string | null>(now);
  const [notes, setNotes] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const typeConfig = {
    call: {
      color: 'warm' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    meeting: {
      color: 'warm' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    email: {
      color: 'warm' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  };

  const handleNotesSave = async (value: string | null) => {
    if (!value || value.trim() === '') {
      return; // Don't create if empty
    }

    setIsCreating(true);
    try {
      await createInteraction.mutateAsync({
        contactId,
        type,
        date,
        time: time || null,
        notes: value.trim() || null,
      });
      
      // Reset form with fresh date/time
      const freshToday = new Date().toISOString().split('T')[0];
      const freshNow = new Date().toTimeString().slice(0, 5);
      setNotes(null);
      setType('call');
      setDate(freshToday);
      setTime(freshNow);
      
      onCreated?.();
    } catch (error) {
      console.error('Failed to create interaction:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTypeChange = async (value: string) => {
    setType(value as InteractionType);
  };

  const handleDateChange = async (value: string | null) => {
    setDate(value || today);
  };

  const handleTimeChange = async (value: string | null) => {
    setTime(value);
  };

  if (variant === 'card') {
    // Card variant for ContactList
    return (
      <div className="flex items-start gap-3 opacity-60 hover:opacity-100 transition-opacity">
        <div className="shrink-0 mt-0.5 w-24">
          <InlineEditableSelect
            value={type}
            onSave={handleTypeChange}
            options={INTERACTION_TYPE_OPTIONS}
            badgeVariant="warm"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <InlineEditableDate
              value={date}
              onSave={handleDateChange}
              className="text-sm"
            />
            <InlineEditableTime
              value={time}
              onSave={handleTimeChange}
              className="text-sm"
              emptyText="Add time"
            />
          </div>
          <InlineEditableTextarea
            value={notes}
            onSave={handleNotesSave}
            emptyText="Click to add new interaction..."
            rows={2}
            className="text-xs"
          />
        </div>
      </div>
    );
  }

  // Detail variant for ContactDetail
  return (
    <div className="flex gap-4 p-4 bg-dark-800/30 rounded-lg border border-dashed border-dark-600 hover:border-warm-500/30 transition-colors">
      <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-warm-500/10 text-warm-400">
        {typeConfig[type].icon}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <InlineEditableSelect
            value={type}
            onSave={handleTypeChange}
            options={INTERACTION_TYPE_OPTIONS}
            badgeVariant={typeConfig[type].color}
          />
          <span className="text-sm text-dark-400">on</span>
          <InlineEditableDate
            value={date}
            onSave={handleDateChange}
          />
          <span className="text-sm text-dark-400">at</span>
          <InlineEditableTime
            value={time}
            onSave={handleTimeChange}
          />
        </div>
        <div>
          <InlineEditableTextarea
            value={notes}
            onSave={handleNotesSave}
            emptyText="Click to add new interaction..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

