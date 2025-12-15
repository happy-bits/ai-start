import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useContacts, useDeleteContact, useUpdateContact } from '../../api/contacts';
import { useInteractions, useUpdateInteraction, useDeleteInteraction } from '../../api/interactions';
import { INTERACTION_TYPE_OPTIONS } from '../../api/types';

import { Button, Card, LoadingSpinner, EmptyState, Avatar, SearchInput, InlineEditable, InlineEditableDate, InlineEditableDateWithQuickActions, InlineEditableSelect, InlineEditableTime, InlineEditableTextarea } from '../../components/ui';
import NewInteractionRow from '../../components/NewInteractionRow';

import { deleteButtonBase, deleteButtonSize, cn } from '../../utils/styles';
import { getLatestInteractionsForContact, isFollowUpDue, sortContacts } from '../../utils';

import type { Contact, Interaction, InteractionType } from '../../api/types';

// Component to render priority contacts as cards
function PriorityContactCards({ contacts, updateContact, deleteContact, interactions = [] }: { contacts: Contact[]; updateContact: ReturnType<typeof useUpdateContact>; deleteContact: ReturnType<typeof useDeleteContact>; interactions?: Interaction[] }) {
  const updateInteraction = useUpdateInteraction();
  const deleteInteraction = useDeleteInteraction();
  
  const handleDelete = async (id: number) => {
    deleteContact.mutate(id);
  };

  const handleDeleteInteraction = async (interactionId: number) => {
    deleteInteraction.mutate(interactionId);
  };

  return (
    <div className="space-y-4" role="list" aria-label="Priority contacts">
      {contacts.map((contact) => {
        const latestInteractions = getLatestInteractionsForContact(interactions, contact.id, 3);
        return (
          <Card key={contact.id} as="article" aria-label={`Contact: ${contact.name}`} className="hover:border-warm-500/30 transition-colors">
            <div className="space-y-4" role="listitem">
              {/* Contact Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={contact.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <InlineEditable
                      value={contact.name}
                      onSave={async (value) => {
                        await updateContact.mutateAsync({
                          id: contact.id,
                          data: { name: value || '' },
                        });
                      }}
                      type="text"
                      placeholder="Contact name"
                      className="text-white font-medium hover:text-white truncate"
                      emptyText="Add name"
                      aria-label={`Contact name for ${contact.name}`}
                    />
                    <div className="mt-1">
                      <InlineEditable
                        value={contact.company}
                        onSave={async (value) => {
                          await updateContact.mutateAsync({
                            id: contact.id,
                            data: { company: value },
                          });
                        }}
                        type="text"
                        placeholder="Company name"
                        className="text-dark-400 hover:text-white truncate"
                        emptyText="Add company"
                        aria-label={`Company name for ${contact.name}`}
                      />
                    </div>
                    {/* Contact Info */}
                    <div className="space-y-1 mt-2">
                      <InlineEditable
                        value={contact.email}
                        onSave={async (value) => {
                          await updateContact.mutateAsync({
                            id: contact.id,
                            data: { email: value },
                          });
                        }}
                        type="email"
                        placeholder="email@example.com"
                        emptyText="Add email"
                        aria-label={`Email for ${contact.name}`}
                      />
                      <InlineEditable
                        value={contact.phone}
                        onSave={async (value) => {
                          await updateContact.mutateAsync({
                            id: contact.id,
                            data: { phone: value },
                          });
                        }}
                        type="tel"
                        placeholder="+46 73 345 67 89"
                        emptyText="Add phone"
                        aria-label={`Phone for ${contact.name}`}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(contact.id)}
                    disabled={deleteContact.isPending}
                    aria-label={`Delete ${contact.name}`}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Follow-up Date */}
              <div>
                <InlineEditableDateWithQuickActions
                  value={contact.followUpDate}
                  onSave={async (value) => {
                    await updateContact.mutateAsync({
                      id: contact.id,
                      data: { followUpDate: value },
                    });
                  }}
                  emptyText="Add follow-up date"
                />
              </div>

              {/* Interactions */}
              <div className="pt-4 space-y-3">
                <NewInteractionRow contactId={contact.id} variant="card" />
                {latestInteractions.length > 0 && (
                  <>
                    {latestInteractions.map((interaction) => (
                      <div key={interaction.id} className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5 w-24">
                          <InlineEditableSelect
                            value={interaction.type}
                            onSave={async (value) => {
                              await updateInteraction.mutateAsync({
                                id: interaction.id,
                                data: { type: value as InteractionType },
                              });
                            }}
                            options={INTERACTION_TYPE_OPTIONS}
                            badgeVariant="warm"
                            aria-label="Interaction type"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <InlineEditableDate
                              value={interaction.date}
                              onSave={async (value) => {
                                await updateInteraction.mutateAsync({
                                  id: interaction.id,
                                  data: { date: value || interaction.date },
                                });
                              }}
                              className="text-sm"
                              aria-label="Interaction date"
                            />
                            <InlineEditableTime
                              value={interaction.time}
                              onSave={async (value) => {
                                await updateInteraction.mutateAsync({
                                  id: interaction.id,
                                  data: { time: value },
                                });
                              }}
                              className="text-sm"
                              emptyText="Add time"
                              aria-label="Interaction time"
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
                              className="text-xs"
                              aria-label="Interaction notes"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteInteraction(interaction.id)}
                          className={cn(deleteButtonBase, deleteButtonSize.sm, 'shrink-0 mt-0.5')}
                          aria-label={`Delete interaction from ${interaction.date}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Component to render contact table
function ContactTable({ contacts, updateContact, deleteContact }: { contacts: Contact[]; updateContact: ReturnType<typeof useUpdateContact>; deleteContact: ReturnType<typeof useDeleteContact> }) {
  const handleDelete = async (id: number) => {
    deleteContact.mutate(id);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-700">
            <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
              Contact Info
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-dark-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-700">
          {contacts.map((contact, index) => {
            return (
              <>
                {index > 0 && (
                  <tr key={`spacer-${contact.id}`}>
                    <td colSpan={3} className="h-6 border-b border-dark-700/50"></td>
                  </tr>
                )}
                <tr key={contact.id} className="hover:bg-dark-800/50 transition-colors border-b border-dark-700/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar name={contact.name} size="md" />
                      <div className="flex-1">
                        <InlineEditable
                          value={contact.name}
                          onSave={async (value) => {
                            await updateContact.mutateAsync({
                              id: contact.id,
                              data: { name: value || '' },
                            });
                          }}
                          type="text"
                          placeholder="Contact name"
                          className="text-white font-medium hover:text-white"
                          emptyText="Add name"
                          aria-label={`Contact name for ${contact.name}`}
                        />
                        <div className="mt-1">
                          <InlineEditable
                            value={contact.company}
                            onSave={async (value) => {
                              await updateContact.mutateAsync({
                                id: contact.id,
                                data: { company: value },
                              });
                            }}
                            type="text"
                            placeholder="Company name"
                            className="text-dark-400 hover:text-white"
                            emptyText="Add company"
                            aria-label={`Company name for ${contact.name}`}
                          />
                        </div>
                        <div className="mt-2">
                          <InlineEditableDate
                            value={contact.followUpDate}
                            onSave={async (value) => {
                              await updateContact.mutateAsync({
                                id: contact.id,
                                data: { followUpDate: value },
                              });
                            }}
                            emptyText="Add follow-up date"
                            aria-label={`Follow-up date for ${contact.name}`}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <InlineEditable
                        value={contact.email}
                        onSave={async (value) => {
                          await updateContact.mutateAsync({
                            id: contact.id,
                            data: { email: value },
                          });
                        }}
                        type="email"
                        placeholder="email@example.com"
                        emptyText="Add email"
                        aria-label={`Email for ${contact.name}`}
                      />
                      <InlineEditable
                        value={contact.phone}
                        onSave={async (value) => {
                          await updateContact.mutateAsync({
                            id: contact.id,
                            data: { phone: value },
                          });
                        }}
                        type="tel"
                        placeholder="+46 73 345 67 89"
                        emptyText="Add phone"
                        aria-label={`Phone for ${contact.name}`}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contact.id)}
                        disabled={deleteContact.isPending}
                        aria-label={`Delete ${contact.name}`}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ContactList() {
  const { data: contacts = [], isLoading } = useContacts();
  const { data: interactions = [] } = useInteractions();
  const deleteContact = useDeleteContact();
  const updateContact = useUpdateContact();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter contacts globally first
  const filteredContacts = useMemo(() => {
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  // Split into priority (due today or earlier) and other contacts
  const { priorityContacts, otherContacts } = useMemo(() => {
    const priority = filteredContacts.filter((contact) => isFollowUpDue(contact.followUpDate));
    const other = filteredContacts.filter((contact) => !isFollowUpDue(contact.followUpDate));
    return {
      priorityContacts: sortContacts(priority),
      otherContacts: sortContacts(other),
    };
  }, [filteredContacts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-dark-400 mt-1">Manage your contact relationships</p>
        </div>
        <Link to="/contacts/new">
          <Button aria-label="Add new contact">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </Button>
        </Link>
      </div>

      {/* Search */}
      <SearchInput
        placeholder="Search contacts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {isLoading ? (
        <Card padding="none">
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        </Card>
      ) : (
        <>
          {/* Priority/Todo Section */}
          <section aria-labelledby="priority-heading" className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 id="priority-heading" className="text-lg font-semibold text-white">Today's Follow-ups</h2>
              {priorityContacts.length > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-warm-500/20 text-warm-300 rounded-full">
                  {priorityContacts.length}
                </span>
              )}
            </div>
            {priorityContacts.length === 0 ? (
              <Card>
                <EmptyState
                icon={
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="All caught up!"
                message="No follow-ups due today. Great work!"
              />
              </Card>
            ) : (
              <PriorityContactCards contacts={priorityContacts} updateContact={updateContact} deleteContact={deleteContact} interactions={interactions} />
            )}
          </section>

          {/* Other Contacts Section */}
          {otherContacts.length > 0 && (
            <section aria-labelledby="other-contacts-heading" className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 id="other-contacts-heading" className="text-lg font-semibold text-white">Other Contacts</h2>
                <span className="px-2 py-1 text-xs font-medium bg-dark-700 text-dark-300 rounded-full">
                  {otherContacts.length}
                </span>
              </div>
              <Card padding="none">
                <ContactTable contacts={otherContacts} updateContact={updateContact} deleteContact={deleteContact} />
              </Card>
            </section>
          )}

          {/* Empty state when no contacts match search */}
          {filteredContacts.length === 0 && (
            <Card padding="none">
              <EmptyState
                icon={
                  <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                title="No contacts found"
                message={searchTerm ? 'Try a different search term' : 'Get started by adding your first contact'}
                action={!searchTerm ? (
                  <Link to="/contacts/new">
                    <Button size="sm" aria-label="Add new contact">Add Contact</Button>
                  </Link>
                ) : undefined}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

