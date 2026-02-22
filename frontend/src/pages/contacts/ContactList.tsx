import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useContacts, useDeleteContact, useUpdateContact } from '../../api/contacts';
import {
  useDeleteInteraction,
  useInteractions,
  useUpdateInteraction,
} from '../../api/interactions';
import type { Contact, Interaction, InteractionType } from '../../api/types';
import { INTERACTION_TYPE_OPTIONS } from '../../api/types';
import {
  Button,
  Card,
  EmptyState,
  InlineEditable,
  InlineEditableDate,
  InlineEditableDateWithQuickActions,
  InlineEditableLinkedIn,
  InlineEditableSelect,
  InlineEditableTextarea,
  InlineEditableTime,
  LoadingSpinner,
  SearchInput,
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { sortContacts, sortInteractionsByRecency } from '../../utils';
import { getTodayISO } from '../../utils/dates';
import { cn, deleteButtonBase, deleteButtonSize } from '../../utils/styles';
import NewInteractionRow from '../interactions/NewInteractionRow';
import ImportContactsModal from './ImportContactsModal';

const FILTER_ATT_KONTAKTA = 'att-kontakta';
const FILTER_ALL = 'all';

type ContactFilter = typeof FILTER_ATT_KONTAKTA | typeof FILTER_ALL;

function isContactDueForFollowUp(contact: Contact, today: string): boolean {
  if (!contact.followUpDate) return false;
  return contact.followUpDate <= today;
}

// Component to render contact list
function ContactTable({
  contacts,
  updateContact,
  deleteContact,
  interactions = [],
}: {
  contacts: Contact[];
  updateContact: ReturnType<typeof useUpdateContact>;
  deleteContact: ReturnType<typeof useDeleteContact>;
  interactions?: Interaction[];
}) {
  // Initialize with all contacts collapsed
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const updateInteraction = useUpdateInteraction();
  const deleteInteraction = useDeleteInteraction();

  const handleDelete = async (id: number) => {
    deleteContact.mutate(id);
  };

  const handleDeleteInteraction = async (interactionId: number) => {
    deleteInteraction.mutate(interactionId);
  };

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-0">
      {/* Contact items */}
      <div className="divide-y divide-dark-700">
        {contacts.map((contact) => {
          const isExpanded = expandedIds.has(contact.id);
          const allInteractions = sortInteractionsByRecency(
            interactions.filter((interaction) => interaction.contactId === contact.id),
          );

          return (
            <article
              key={contact.id}
              className="hover:bg-dark-800/50 transition-colors border-b border-dark-700/30"
              aria-label={`Contact: ${contact.name}`}
            >
              {/* Compact row */}
              <button
                type="button"
                className="px-4 py-2 cursor-pointer w-full text-left bg-transparent border-none"
                onClick={() => toggleExpanded(contact.id)}
                aria-label={isExpanded ? 'Collapse contact details' : 'Expand contact details'}
              >
                <div className="flex items-center gap-4">
                  {/* Toggle indicator */}
                  <div className="shrink-0 text-dark-400">
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <title>Expand</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>

                  {/* Show contact info only when collapsed */}
                  {!isExpanded && (
                    <>
                      {/* Follow-up date */}
                      {contact.followUpDate && (
                        <div className="shrink-0 text-sm text-dark-400 font-mono w-24">
                          {contact.followUpDate}
                        </div>
                      )}
                      {!contact.followUpDate && <div className="shrink-0 w-24"></div>}

                      {/* Name */}
                      <div className="shrink-0 text-sm text-white font-medium min-w-[120px]">
                        {contact.name || 'Unnamed contact'}
                      </div>

                      {/* Company */}
                      {contact.company && (
                        <div className="shrink-0 text-sm text-dark-400 min-w-[100px]">
                          {contact.company}
                        </div>
                      )}

                      {/* Spacer */}
                      <div className="flex-1"></div>
                    </>
                  )}

                  {/* Spacer when expanded */}
                  {isExpanded && <div className="flex-1"></div>}

                  {/* Delete button */}
                  <div className="shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(contact.id);
                      }}
                      disabled={deleteContact.isPending}
                      aria-label={`Delete ${contact.name}`}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-dark-700/50">
                  <div className="pt-4 space-y-4">
                    {/* Contact Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
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
                            <InlineEditableLinkedIn
                              value={contact.linkedin}
                              onSave={async (value) => {
                                await updateContact.mutateAsync({
                                  id: contact.id,
                                  data: { linkedin: value },
                                });
                              }}
                              placeholder="username"
                              emptyText="Add LinkedIn"
                              aria-label={`LinkedIn for ${contact.name}`}
                            />
                          </div>
                        </div>
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
                      {allInteractions.length > 0 &&
                        allInteractions.map((interaction) => (
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
                              type="button"
                              onClick={() => handleDeleteInteraction(interaction.id)}
                              className={cn(
                                deleteButtonBase,
                                deleteButtonSize.sm,
                                'shrink-0 mt-0.5',
                              )}
                              aria-label={`Delete interaction from ${interaction.date}`}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function ContactList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: contacts = [], isLoading } = useContacts();
  const { data: interactions = [] } = useInteractions();
  const deleteContact = useDeleteContact();
  const updateContact = useUpdateContact();
  const [searchTerm, setSearchTerm] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const { user } = useAuth();

  const firstName = user?.name?.split(' ')[0];

  const filterParam = searchParams.get('filter');
  const filter: ContactFilter = filterParam === FILTER_ALL ? FILTER_ALL : FILTER_ATT_KONTAKTA;

  const setFilter = (newFilter: ContactFilter) => {
    setSearchParams(newFilter === FILTER_ATT_KONTAKTA ? {} : { filter: newFilter });
  };

  const today = getTodayISO();

  // Filter contacts by search first
  const searchFilteredContacts = useMemo(() => {
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.linkedin?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [contacts, searchTerm]);

  // Filter by "att kontakta" (follow_up_date <= today) or show all
  const filterFilteredContacts = useMemo(() => {
    if (filter === FILTER_ALL) return searchFilteredContacts;
    return searchFilteredContacts.filter((c) => isContactDueForFollowUp(c, today));
  }, [searchFilteredContacts, filter, today]);

  // Sort contacts
  const sortedContacts = useMemo(() => {
    return sortContacts(filterFilteredContacts);
  }, [filterFilteredContacts]);

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="rounded-xl bg-gradient-to-r from-warm-500/10 to-warm-400/5 border border-warm-500/20 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">
          Welcome back{firstName ? `, ${firstName}` : ''}!
        </h2>
        <p className="text-dark-400 text-sm mt-1">
          {filter === FILTER_ATT_KONTAKTA && filterFilteredContacts.length > 0
            ? `You have ${filterFilteredContacts.length} contact${filterFilteredContacts.length === 1 ? '' : 's'} to follow up with today.`
            : "You're all caught up. Keep those relationships warm!"}
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-dark-400 mt-1">Manage your contact relationships</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setImportModalOpen(true)}
            aria-label="Import contacts from CSV"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import
          </Button>
          <Link to="/contacts/new">
            <Button aria-label="Add new contact">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Contact
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <SearchInput
        placeholder="Search contacts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Filter tabs */}
      <div role="tablist" aria-label="Contact filter" className="flex gap-1">
        <button
          type="button"
          role="tab"
          aria-selected={filter === FILTER_ATT_KONTAKTA}
          aria-controls="contacts-panel"
          id="tab-att-kontakta"
          onClick={() => setFilter(FILTER_ATT_KONTAKTA)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            filter === FILTER_ATT_KONTAKTA
              ? 'bg-warm-500/20 text-warm-400 border border-warm-500/40'
              : 'text-dark-400 hover:text-white border border-dark-700 hover:border-dark-600',
          )}
        >
          To contact
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === FILTER_ALL}
          aria-controls="contacts-panel"
          id="tab-all"
          onClick={() => setFilter(FILTER_ALL)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            filter === FILTER_ALL
              ? 'bg-warm-500/20 text-warm-400 border border-warm-500/40'
              : 'text-dark-400 hover:text-white border border-dark-700 hover:border-dark-600',
          )}
        >
          All
        </button>
      </div>

      {isLoading ? (
        <Card padding="none">
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        </Card>
      ) : (
        <section
          id="contacts-panel"
          role="tabpanel"
          aria-labelledby="contacts-heading"
          className="space-y-3"
        >
          {sortedContacts.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <h2 id="contacts-heading" className="text-lg font-semibold text-white">
                  Contacts
                </h2>
                <span className="px-2 py-1 text-xs font-medium bg-dark-700 text-dark-300 rounded-full">
                  {sortedContacts.length}
                </span>
              </div>
              <Card padding="none">
                <ContactTable
                  contacts={sortedContacts}
                  updateContact={updateContact}
                  deleteContact={deleteContact}
                  interactions={interactions}
                />
              </Card>
            </>
          ) : (
            <Card padding="none">
              {filter === FILTER_ATT_KONTAKTA && !searchTerm && contacts.length > 0 ? (
                <EmptyState
                  icon={
                    <svg
                      className="w-10 h-10 text-warm-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                  title="All caught up!"
                  message="No contacts need follow-up right now. Great job!"
                />
              ) : (
                <EmptyState
                  icon={
                    <svg
                      className="w-8 h-8 text-dark-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  }
                  title="No contacts found"
                  message={
                    searchTerm
                      ? 'Try a different search term'
                      : 'Get started by adding your first contact'
                  }
                  action={
                    !searchTerm ? (
                      <Link to="/contacts/new">
                        <Button size="sm" aria-label="Add new contact">
                          Add Contact
                        </Button>
                      </Link>
                    ) : undefined
                  }
                />
              )}
            </Card>
          )}
        </section>
      )}

      <ImportContactsModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} />
    </div>
  );
}
