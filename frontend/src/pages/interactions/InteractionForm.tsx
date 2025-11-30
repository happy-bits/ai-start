import { useState, useEffect, type FormEvent } from 'react';
import { useInteraction, useCreateInteraction, useUpdateInteraction } from '../../api/interactions';
import { Button, Input, Select, Textarea } from '../../components/ui';
import type { InteractionType } from '../../api/types';

interface InteractionFormProps {
  customerId: number;
  interactionId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const interactionTypes = [
  { value: 'call', label: 'Phone Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'email', label: 'Email' },
];

export default function InteractionForm({
  customerId,
  interactionId,
  onSuccess,
  onCancel,
}: InteractionFormProps) {
  const isEditing = !!interactionId;
  const { data: existingInteraction, isLoading } = useInteraction(interactionId || 0);
  const createInteraction = useCreateInteraction();
  const updateInteraction = useUpdateInteraction();

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState({
    type: 'call' as InteractionType,
    date: today,
    time: now,
    notes: '',
  });
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.date) {
      setError('Date is required');
      return;
    }

    try {
      if (isEditing && interactionId) {
        await updateInteraction.mutateAsync({
          id: interactionId,
          data: {
            type: formData.type,
            date: formData.date,
            time: formData.time || null,
            notes: formData.notes.trim() || null,
          },
        });
      } else {
        await createInteraction.mutateAsync({
          customerId,
          type: formData.type,
          date: formData.date,
          time: formData.time || null,
          notes: formData.notes.trim() || null,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-warm-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-white">
        {isEditing ? 'Edit Interaction' : 'Log New Interaction'}
      </h3>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Select
        label="Type"
        value={formData.type}
        onChange={(e) =>
          setFormData({ ...formData, type: e.target.value as InteractionType })
        }
        options={interactionTypes}
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
          disabled={createInteraction.isPending || updateInteraction.isPending}
        >
          {createInteraction.isPending || updateInteraction.isPending
            ? 'Saving...'
            : isEditing
            ? 'Update'
            : 'Log Interaction'}
        </Button>
      </div>
    </form>
  );
}

