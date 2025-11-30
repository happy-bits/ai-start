import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useContacts, useDeleteContact, useUpdateContact } from '../../api/contacts';
import { useInteractions } from '../../api/interactions';
import { Button, Card, LoadingSpinner, EmptyState, Avatar, SearchInput, InlineEditable, InlineEditableDate } from '../../components/ui';

import type { Contact, Interaction } from '../../api/types';

// Helper function to check if a follow-up date is today or earlier
function isFollowUpDue(followUpDate: string | null): boolean {
  if (!followUpDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUp = new Date(followUpDate);
  followUp.setHours(0, 0, 0, 0);
  return followUp <= today;
}

// Helper function to sort contacts
function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    // If both have followup dates, sort by date (earliest first), then by ID if dates are equal
    if (a.followUpDate && b.followUpDate) {
      const dateDiff = new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      // If dates are equal, sort by ID
      return a.id - b.id;
    }
    // If only a has a followup date, it comes first
    if (a.followUpDate && !b.followUpDate) {
      return -1;
    }
    // If only b has a followup date, it comes first
    if (!a.followUpDate && b.followUpDate) {
      return 1;
    }
    // If neither has a followup date, sort by ID
    return a.id - b.id;
  });
}

// Helper function to get latest interactions for a contact
function getLatestInteractions(interactions: Interaction[], contactId: number, limit: number = 3): Interaction[] {
  return interactions
    .filter((interaction) => interaction.contactId === contactId)
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      // If dates are equal, sort by time if available
      if (a.time && b.time) {
        return b.time.localeCompare(a.time);
      }
      return 0;
    })
    .slice(0, limit);
}

// Type config for interaction icons
const typeConfig = {
  call: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  meeting: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  email: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
};

// Component to render priority contacts as cards
function PriorityContactCards({ contacts, updateContact, deleteContact, interactions = [] }: { contacts: Contact[]; updateContact: ReturnType<typeof useUpdateContact>; deleteContact: ReturnType<typeof useDeleteContact>; interactions?: Interaction[] }) {
  const handleDelete = async (id: number) => {
    deleteContact.mutate(id);
  };

  return (
    <div className="space-y-4">
      {contacts.map((contact) => {
        const latestInteractions = getLatestInteractions(interactions, contact.id, 3);
        return (
          <Card key={contact.id} className="hover:border-warm-500/30 transition-colors">
            <div className="space-y-4">
              {/* Contact Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={contact.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {contact.name}
                    </p>
                    {contact.company && (
                      <p className="text-sm text-dark-400 mt-1 truncate">{contact.company}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/contacts/${contact.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-warm-400 hover:text-warm-300 hover:bg-warm-500/10"
                    >
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(contact.id)}
                    disabled={deleteContact.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Follow-up Date */}
              <div>
                <InlineEditableDate
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

              {/* Contact Info */}
              <div className="space-y-2">
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
                />
              </div>

              {/* Interactions */}
              {latestInteractions.length > 0 && (
                <div className="pt-4 border-t border-dark-700 space-y-3">
                  {latestInteractions.map((interaction) => (
                    <div key={interaction.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-warm-500/10 text-warm-400 mt-0.5">
                        {typeConfig[interaction.type]?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-sm text-dark-400">
                            {new Date(interaction.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          {interaction.time && (
                            <>
                              <span className="text-dark-500">•</span>
                              <span className="text-sm text-dark-400">
                                {interaction.time}
                              </span>
                            </>
                          )}
                        </div>
                        {interaction.notes && (
                          <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">
                            {interaction.notes}
                          </p>
                        )}
                        {!interaction.notes && (
                          <p className="text-xs text-dark-500 italic">No notes</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {latestInteractions.length === 0 && (
                <div className="pt-4 border-t border-dark-700">
                  <span className="text-xs text-dark-500">No interactions</span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Component to render contact table
function ContactTable({ contacts, updateContact, deleteContact, interactions = [], showInteractions = false, showHeader = true }: { contacts: Contact[]; updateContact: ReturnType<typeof useUpdateContact>; deleteContact: ReturnType<typeof useDeleteContact>; interactions?: Interaction[]; showInteractions?: boolean; showHeader?: boolean }) {
  const handleDelete = async (id: number) => {
    deleteContact.mutate(id);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {showHeader && (
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
        )}
        <tbody className="divide-y divide-dark-700">
          {contacts.map((contact, index) => {
            const latestInteractions = showInteractions ? getLatestInteractions(interactions, contact.id, 3) : [];
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
                        <p className="text-sm font-medium text-white">
                          {contact.name}
                        </p>
                        {contact.company && (
                          <p className="text-sm text-dark-400 mt-1">{contact.company}</p>
                        )}
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
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/contacts/${contact.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-warm-400 hover:text-warm-300 hover:bg-warm-500/10"
                        >
                          Interactions
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contact.id)}
                        disabled={deleteContact.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
                {showInteractions && latestInteractions.length > 0 && (
                  <>
                    {latestInteractions.map((interaction) => (
                      <tr key={`interaction-${interaction.id}`} className="bg-dark-800/30 hover:bg-dark-800/40 transition-colors">
                        <td colSpan={3} className="px-6 py-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-warm-500/10 text-warm-400 mt-0.5">
                              {typeConfig[interaction.type]?.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="text-sm text-dark-400">
                                  {new Date(interaction.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                                {interaction.time && (
                                  <>
                                    <span className="text-dark-500">•</span>
                                    <span className="text-sm text-dark-400">
                                      {interaction.time}
                                    </span>
                                  </>
                                )}
                              </div>
                              {interaction.notes && (
                                <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">
                                  {interaction.notes}
                                </p>
                              )}
                              {!interaction.notes && (
                                <p className="text-xs text-dark-500 italic">No notes</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
                {showInteractions && latestInteractions.length === 0 && (
                  <tr className="bg-dark-800/30">
                    <td colSpan={3} className="px-6 py-3">
                      <span className="text-xs text-dark-500">No interactions</span>
                    </td>
                  </tr>
                )}
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
          <Button>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Today's Follow-ups</h2>
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
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          </div>

          {/* Other Contacts Section */}
          {otherContacts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Other Contacts</h2>
                <span className="px-2 py-1 text-xs font-medium bg-dark-700 text-dark-300 rounded-full">
                  {otherContacts.length}
                </span>
              </div>
              <Card padding="none">
                <ContactTable contacts={otherContacts} updateContact={updateContact} deleteContact={deleteContact} />
              </Card>
            </div>
          )}

          {/* Empty state when no contacts match search */}
          {filteredContacts.length === 0 && (
            <Card padding="none">
              <EmptyState
                icon={
                  <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                title="No contacts found"
                message={searchTerm ? 'Try a different search term' : 'Get started by adding your first contact'}
                action={!searchTerm ? (
                  <Link to="/contacts/new">
                    <Button size="sm">Add Contact</Button>
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

