import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useContacts, useDeleteContact, useUpdateContact } from '../../api/contacts';
import { Button, Card, LoadingSpinner, EmptyState, Avatar, SearchInput, InlineEditable } from '../../components/ui';
import { actionButtonBase } from '../../utils/styles';

import type { Contact } from '../../api/types';

// Helper function to sort contacts alphabetically by name
function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
}

// Component to render contact table
function ContactTable({ contacts, updateContact, deleteContact, showHeader = true }: { contacts: Contact[]; updateContact: ReturnType<typeof useUpdateContact>; deleteContact: ReturnType<typeof useDeleteContact>; showHeader?: boolean }) {
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className={actionButtonBase}
                      >
                        View
                      </Button>
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
  const deleteContact = useDeleteContact();
  const updateContact = useUpdateContact();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort contacts alphabetically
  const sortedContacts = useMemo(() => {
    const filtered = contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return sortContacts(filtered);
  }, [contacts, searchTerm]);

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
      ) : sortedContacts.length === 0 ? (
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
      ) : (
        <Card padding="none">
          <ContactTable contacts={sortedContacts} updateContact={updateContact} deleteContact={deleteContact} />
        </Card>
      )}
    </div>
  );
}

