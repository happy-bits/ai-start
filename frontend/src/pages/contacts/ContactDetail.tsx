import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useContact } from '../../api/contacts';
import { useInteractions, useDeleteInteraction, useUpdateInteraction } from '../../api/interactions';
import { INTERACTION_TYPE_OPTIONS } from '../../api/types';
import { 
  Button, 
  Card, 
  LoadingSpinner, 
  BackButton, 
  Avatar, 
  EmptyState,
  InlineEditableSelect,
  InlineEditableDate,
  InlineEditableTime,
  InlineEditableTextarea,
} from '../../components/ui';
import InteractionForm from '../interactions/InteractionForm';
import NewInteractionRow from '../../components/NewInteractionRow';
import { interactionTypeConfig } from '../../config/interactions';
import { deleteButtonBase, deleteButtonSize, iconContainer, cardContainer, cn } from '../../utils/styles';
import { sortInteractionsByRecency } from '../../utils';

import type { InteractionType } from '../../api/types';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const contactId = parseInt(id!, 10);

  const { data: contact, isLoading: contactLoading } = useContact(contactId);
  const { data: interactions = [], isLoading: interactionsLoading } = useInteractions(contactId);
  const deleteInteraction = useDeleteInteraction();
  const updateInteraction = useUpdateInteraction();

  const [showInteractionForm, setShowInteractionForm] = useState(false);

  const handleDeleteInteraction = async (interactionId: number) => {
    deleteInteraction.mutate(interactionId);
  };

  const sortedInteractions = sortInteractionsByRecency(interactions);

  if (contactLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-white">Contact not found</h2>
        <p className="text-dark-400 mt-2">The contact you're looking for doesn't exist.</p>
        <Link to="/contacts" className="mt-4 inline-block">
          <Button variant="secondary">Back to Contacts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton to="/contacts" />
        <div className="flex items-center gap-4">
          <Avatar name={contact.name} size="lg" className="shadow-lg shadow-warm-500/25 rounded-2xl" />
          <div>
            <h1 className="text-2xl font-bold text-white">{contact.name}</h1>
            {contact.company && (
              <p className="text-dark-400">{contact.company}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Interactions */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Interactions</h2>
              <Button size="sm" onClick={() => setShowInteractionForm(true)} aria-label="Log new interaction">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Log Interaction
              </Button>
            </div>

            {showInteractionForm && (
              <div className="mb-6 p-4 bg-dark-800 rounded-lg border border-dark-600">
                <InteractionForm
                  contactId={contactId}
                  onSuccess={() => setShowInteractionForm(false)}
                  onCancel={() => setShowInteractionForm(false)}
                />
              </div>
            )}

            {interactionsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="space-y-4">
                <NewInteractionRow contactId={contactId} variant="detail" />
                {sortedInteractions.length === 0 ? (
                <EmptyState
                  icon={
                    <svg className="w-6 h-6 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  }
                  title="No interactions recorded yet"
                  message="Start logging interactions to track your contact relationships"
                  className="py-8"
                />
                ) : (
                                  sortedInteractions.map((interaction) => (
                  <article
                    key={interaction.id}
                    className={cn('flex gap-4 p-4', cardContainer)}
                    aria-label={`${interaction.type} interaction on ${interaction.date}`}
                  >
                    <div className={iconContainer} aria-hidden="true">
                      {interactionTypeConfig[interaction.type].icon}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <InlineEditableSelect
                          value={interaction.type}
                          onSave={async (value) => {
                            await updateInteraction.mutateAsync({
                              id: interaction.id,
                              data: { type: value as InteractionType },
                            });
                          }}
                          options={INTERACTION_TYPE_OPTIONS}
                          badgeVariant={interactionTypeConfig[interaction.type].color}
                        />
                        <span className="text-sm text-dark-400">on</span>
                        <InlineEditableDate
                          value={interaction.date}
                          onSave={async (value) => {
                            await updateInteraction.mutateAsync({
                              id: interaction.id,
                              data: { date: value || undefined },
                            });
                          }}
                        />
                        <span className="text-sm text-dark-400">at</span>
                        <InlineEditableTime
                          value={interaction.time}
                          onSave={async (value) => {
                            await updateInteraction.mutateAsync({
                              id: interaction.id,
                              data: { time: value },
                            });
                          }}
                        />
                      </div>
                      <div>
                        <InlineEditableTextarea
                          value={interaction.notes}
                          onSave={async (value) => {
                            await updateInteraction.mutateAsync({
                              id: interaction.id,
                              data: { notes: value },
                            });
                          }}
                          emptyText="Click to add notes"
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-1 shrink-0">
                      <button
                        onClick={() => handleDeleteInteraction(interaction.id)}
                        className={cn(deleteButtonBase, deleteButtonSize.md)}
                        aria-label={`Delete ${interaction.type} interaction from ${interaction.date}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </article>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

