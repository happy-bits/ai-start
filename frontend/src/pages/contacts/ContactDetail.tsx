import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useContact, useDeleteContact, useUpdateContact } from '../../api/contacts';
import { useInteractions, useDeleteInteraction } from '../../api/interactions';
import { Button, Card, Badge, LoadingSpinner, BackButton, EmptyState, Input, ErrorMessage } from '../../components/ui';
import InteractionForm from '../interactions/InteractionForm';
import { useFormSubmission } from '../../hooks/useFormSubmission';
import type { UpdateContactData, Contact } from '../../api/types';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contactId = parseInt(id!, 10);

  const { data: contact, isLoading: contactLoading } = useContact(contactId);
  const { data: interactions = [], isLoading: interactionsLoading } = useInteractions(contactId);
  const deleteContact = useDeleteContact();
  const deleteInteraction = useDeleteInteraction();
  const updateContact = useUpdateContact();

  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
      });
    }
  }, [contact]);

  const { error, isSubmitting, handleSubmit } = useFormSubmission<
    UpdateContactData,
    Contact
  >({
    onSubmit: async (data) => {
      return await updateContact.mutateAsync({ id: contactId, data });
    },
    onSuccess: () => {
      // Don't navigate, just stay on the page
      return undefined;
    },
    validate: (data) => {
      if (!data.name?.trim()) {
        return 'Name is required';
      }
      return null;
    },
  });

  const onSubmit = (e: FormEvent) => {
    const data = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      company: formData.company.trim() || null,
    };
    handleSubmit(e, data);
  };

  const handleDeleteContact = async () => {
    if (contact && confirm(`Are you sure you want to delete "${contact.name}"?`)) {
      await deleteContact.mutateAsync(contactId);
      navigate('/contacts');
    }
  };

  const handleDeleteInteraction = async (interactionId: number) => {
    if (confirm('Are you sure you want to delete this interaction?')) {
      deleteInteraction.mutate(interactionId);
    }
  };

  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const typeConfig = {
    call: {
      color: 'green' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    meeting: {
      color: 'purple' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    email: {
      color: 'blue' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  };

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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton to="/contacts" />
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Contact</h1>
            <p className="text-dark-400 mt-1">Update contact information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            onClick={handleDeleteContact}
            disabled={deleteContact.isPending}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Contact Form */}
        <Card>
          <form onSubmit={onSubmit} className="space-y-6">
            <ErrorMessage error={error} />

            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
              />

              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <Input
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Acme Inc."
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Interactions */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Interactions</h2>
              <Button size="sm" onClick={() => setShowInteractionForm(true)}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            {editingInteraction !== null && (
              <div className="mb-6 p-4 bg-dark-800 rounded-lg border border-dark-600">
                <InteractionForm
                  contactId={contactId}
                  interactionId={editingInteraction}
                  onSuccess={() => setEditingInteraction(null)}
                  onCancel={() => setEditingInteraction(null)}
                />
              </div>
            )}

            {interactionsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : sortedInteractions.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-6 h-6 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
                title="No interactions recorded yet"
                message="Start logging interactions to track your contact relationships"
                className="py-8"
              />
            ) : (
              <div className="space-y-4">
                {sortedInteractions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="flex gap-4 p-4 bg-dark-800/50 rounded-lg border border-dark-700"
                  >
                    <div
                      className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${
                        interaction.type === 'call'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : interaction.type === 'meeting'
                          ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {typeConfig[interaction.type].icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={typeConfig[interaction.type].color}>
                          {interaction.type}
                        </Badge>
                        <span className="text-sm text-dark-400">
                          {interaction.date}
                          {interaction.time && ` at ${interaction.time}`}
                        </span>
                      </div>
                      {interaction.notes && (
                        <p className="text-dark-300 text-sm whitespace-pre-wrap">
                          {interaction.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-start gap-1 shrink-0">
                      <button
                        onClick={() => setEditingInteraction(interaction.id)}
                        className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteInteraction(interaction.id)}
                        className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

