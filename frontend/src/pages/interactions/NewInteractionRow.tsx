import { useState } from 'react';

import { useCreateInteraction } from '../../api/interactions';
import { INTERACTION_TYPE_OPTIONS } from '../../api/types';

import { InlineEditableTextarea, InlineEditableSelect, InlineEditableDate, InlineEditableTime } from '../../components/ui';

import { interactionTypeConfig } from '../../config/interactions';
import { iconContainer, cardContainerDashed, cn } from '../../utils/styles';
import { getTodayISO, getCurrentTimeHHMM } from '../../utils';

import type { InteractionType } from '../../api/types';

interface NewInteractionRowProps {
  contactId: number;
  variant?: 'detail' | 'card';
  onCreated?: () => void;
}

export default function NewInteractionRow({ contactId, variant = 'detail', onCreated }: NewInteractionRowProps) {
  const createInteraction = useCreateInteraction();
  
  const [type, setType] = useState<InteractionType>('note');
  const [date, setDate] = useState<string>(getTodayISO());
  const [time, setTime] = useState<string | null>(getCurrentTimeHHMM());
  const [notes, setNotes] = useState<string | null>(null);

  const handleNotesSave = async (value: string | null) => {
    if (!value || value.trim() === '') {
      return; // Don't create if empty
    }

    try {
      await createInteraction.mutateAsync({
        contactId,
        type,
        date,
        time: time || null,
        notes: value.trim() || null,
      });
      
      // Reset form with fresh date/time
      setNotes(null);
      setType('note');
      setDate(getTodayISO());
      setTime(getCurrentTimeHHMM());
      
      onCreated?.();
    } catch (error) {
      console.error('Failed to create interaction:', error);
    }
  };

  const handleTypeChange = async (value: string) => {
    setType(value as InteractionType);
  };

  const handleDateChange = async (value: string | null) => {
    setDate(value || getTodayISO());
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

  // Detail variant (default)
  return (
    <div className={cn('flex gap-4 p-4', cardContainerDashed)}>
      <div className={iconContainer}>
        {interactionTypeConfig[type].icon}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <InlineEditableSelect
            value={type}
            onSave={handleTypeChange}
            options={INTERACTION_TYPE_OPTIONS}
            badgeVariant={interactionTypeConfig[type].color}
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
