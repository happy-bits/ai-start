import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  usePermanentlyDeleteContact,
  useRestoreContact,
  useWastebinContacts,
} from '../../api/contacts';
import { useInteractions } from '../../api/interactions';
import type { Contact, Interaction } from '../../api/types';
import { Button, Card, EmptyState, LoadingSpinner, SearchInput } from '../../components/ui';
import { sortContacts, sortInteractionsByRecency } from '../../utils';

// Component to render wastebin contact list
function WastebinTable({
  contacts,
  restoreContact,
  permanentlyDeleteContact,
  interactions = [],
}: {
  contacts: Contact[];
  restoreContact: ReturnType<typeof useRestoreContact>;
  permanentlyDeleteContact: ReturnType<typeof usePermanentlyDeleteContact>;
  interactions?: Interaction[];
}) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const handleRestore = async (id: number) => {
    restoreContact.mutate(id);
  };

  const handlePermanentDelete = async (id: number) => {
    permanentlyDeleteContact.mutate(id);
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
              aria-label={`Deleted contact: ${contact.name}`}
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
                      {/* Deleted date */}
                      {contact.deletedAt && (
                        <div className="shrink-0 text-sm text-dark-400 font-mono w-24">
                          {new Date(contact.deletedAt).toLocaleDateString()}
                        </div>
                      )}
                      {!contact.deletedAt && <div className="shrink-0 w-24"></div>}

                      {/* Name */}
                      <div className="shrink-0 text-sm text-white font-medium min-w-[120px] line-through opacity-60">
                        {contact.name || 'Unnamed contact'}
                      </div>

                      {/* Company */}
                      {contact.company && (
                        <div className="shrink-0 text-sm text-dark-400 min-w-[100px] line-through opacity-60">
                          {contact.company}
                        </div>
                      )}

                      {/* Spacer */}
                      <div className="flex-1"></div>
                    </>
                  )}

                  {/* Spacer when expanded */}
                  {isExpanded && <div className="flex-1"></div>}

                  {/* Action buttons */}
                  <div className="shrink-0 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(contact.id);
                      }}
                      disabled={restoreContact.isPending}
                      aria-label={`Restore ${contact.name}`}
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                    >
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePermanentDelete(contact.id);
                      }}
                      disabled={permanentlyDeleteContact.isPending}
                      aria-label={`Permanently delete ${contact.name}`}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Delete Permanently
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
                          <div className="text-white font-medium line-through opacity-60">
                            {contact.name}
                          </div>
                          <div className="mt-1">
                            <div className="text-dark-400 line-through opacity-60">
                              {contact.company || 'No company'}
                            </div>
                          </div>
                          {/* Contact Info */}
                          <div className="space-y-1 mt-2">
                            <div className="text-dark-400 line-through opacity-60">
                              {contact.email || 'No email'}
                            </div>
                            <div className="text-dark-400 line-through opacity-60">
                              {contact.phone || 'No phone'}
                            </div>
                            {contact.linkedin && (
                              <div className="text-dark-400 line-through opacity-60">
                                linkedin.com/in/{contact.linkedin}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deleted date info */}
                    {contact.deletedAt && (
                      <div className="text-sm text-dark-400">
                        Deleted on {new Date(contact.deletedAt).toLocaleString()}
                      </div>
                    )}

                    {/* Interactions */}
                    {allInteractions.length > 0 && (
                      <div className="pt-4 space-y-3">
                        <div className="text-sm font-medium text-dark-400">
                          Interactions ({allInteractions.length})
                        </div>
                        {allInteractions.map((interaction) => (
                          <div
                            key={interaction.id}
                            className="flex items-start gap-3 text-sm text-dark-400 opacity-60"
                          >
                            <div className="shrink-0 w-24">{interaction.type}</div>
                            <div className="flex-1">
                              <div>
                                {interaction.date} {interaction.time && `at ${interaction.time}`}
                              </div>
                              {interaction.notes && <div className="mt-1">{interaction.notes}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

export default function Wastebin() {
  const { data: contacts = [], isLoading } = useWastebinContacts();
  const { data: interactions = [] } = useInteractions();
  const restoreContact = useRestoreContact();
  const permanentlyDeleteContact = usePermanentlyDeleteContact();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter contacts globally first
  const filteredContacts = useMemo(() => {
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.linkedin?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [contacts, searchTerm]);

  // Sort all contacts
  const sortedContacts = useMemo(() => {
    return sortContacts(filteredContacts);
  }, [filteredContacts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Wastebin</h1>
          <p className="text-dark-400 mt-1">Restore or permanently delete deleted contacts</p>
        </div>
        <Link to="/contacts">
          <Button variant="ghost" aria-label="Back to contacts">
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Contacts
          </Button>
        </Link>
      </div>

      {/* Search */}
      <SearchInput
        placeholder="Search deleted contacts..."
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
          {/* Contacts Section */}
          {sortedContacts.length > 0 && (
            <section aria-labelledby="wastebin-heading" className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 id="wastebin-heading" className="text-lg font-semibold text-white">
                  Deleted Contacts
                </h2>
                <span className="px-2 py-1 text-xs font-medium bg-dark-700 text-dark-300 rounded-full">
                  {sortedContacts.length}
                </span>
              </div>
              <Card padding="none">
                <WastebinTable
                  contacts={sortedContacts}
                  restoreContact={restoreContact}
                  permanentlyDeleteContact={permanentlyDeleteContact}
                  interactions={interactions}
                />
              </Card>
            </section>
          )}

          {/* Empty state when no contacts match search */}
          {sortedContacts.length === 0 && (
            <Card padding="none">
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                }
                title="Wastebin is empty"
                message={
                  searchTerm ? 'No deleted contacts match your search' : 'No deleted contacts'
                }
                action={
                  !searchTerm ? (
                    <Link to="/contacts">
                      <Button size="sm" aria-label="Go to contacts">
                        Go to Contacts
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
