import { useState, useEffect, type FormEvent } from 'react';

import { useInteraction, useCreateInteraction, useUpdateInteraction } from '../../api/interactions';
import { INTERACTION_TYPE_OPTIONS } from '../../api/types';

import { Button, Input, Select, Textarea, LoadingSpinner, ErrorMessage } from '../../components/ui';

import { useFormSubmission } from '../../hooks/useFormSubmission';
import { getTodayISO, getCurrentTimeHHMM } from '../../utils';

import type { InteractionType, Interaction, CreateInteractionData, UpdateInteractionData } from '../../api/types';

interface InteractionFormProps {
  contactId: number;
  interactionId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InteractionForm({
  contactId,
  interactionId,
  onSuccess,
  onCancel,
}: InteractionFormProps) {
  const isEditing = !!interactionId;
  const { data: existingInteraction, isLoading } = useInteraction(interactionId || 0);
  const createInteraction = useCreateInteraction();
  const updateInteraction = useUpdateInteraction();

  const [formData, setFormData] = useState({
    type: 'call' as InteractionType,
    date: getTodayISO(),
    time: getCurrentTimeHHMM(),
    notes: '',
  });

  useEffect(() => {
    if (existingInteraction) {
      setFormData({
        type: existingInteraction.type,
        date: existingInteraction.date,
        time: existingInteraction.time || '',
        notes: existingInteraction.notes || '',
      });
    }
  }, [existingInteraction]);

  const { error, isSubmitting, handleSubmit } = useFormSubmission<
    CreateInteractionData | UpdateInteractionData,
    Interaction
  >({
    onSubmit: async (data) => {
      if (isEditing && interactionId) {
        return await updateInteraction.mutateAsync({
          id: interactionId,
          data: data as UpdateInteractionData,
        });
      } else {
        return await createInteraction.mutateAsync(data as CreateInteractionData);
      }
    },
    onSuccessCallback: onSuccess,
    validate: (data) => {
      if (!data.date) {
        return 'Date is required';
      }
      return null;
    },
  });

  const onSubmit = (e: FormEvent) => {
    const data = isEditing
      ? {
          type: formData.type,
          date: formData.date,
          time: formData.time || null,
          notes: formData.notes.trim() || null,
        }
      : {
          contactId,
          type: formData.type,
          date: formData.date,
          time: formData.time || null,
          notes: formData.notes.trim() || null,
        };
    handleSubmit(e, data);
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-white">
        {isEditing ? 'Edit Interaction' : 'Log New Interaction'}
      </h3>

      <ErrorMessage error={error} />

      <Select
        label="Type"
        value={formData.type}
        onChange={(e) =>
          setFormData({ ...formData, type: e.target.value as InteractionType })
        }
        options={INTERACTION_TYPE_OPTIONS}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />

        <Input
          label="Time"
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
        />
      </div>

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        placeholder="Details about this interaction..."
        rows={3}
      />

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Saving...
            </span>
          ) : isEditing ? (
            'Update'
          ) : (
            'Log Interaction'
          )}
        </Button>
      </div>
    </form>
  );
}

