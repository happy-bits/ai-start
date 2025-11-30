import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContact, useCreateContact, useUpdateContact } from '../../api/contacts';
import { Button, Card, Input, Textarea, LoadingSpinner, BackButton, ErrorMessage } from '../../components/ui';
import { useFormSubmission } from '../../hooks/useFormSubmission';
import type { Contact, CreateContactData, UpdateContactData } from '../../api/types';

export default function ContactForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const contactId = id ? parseInt(id, 10) : 0;

  const { data: existingContact, isLoading } = useContact(contactId);
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  useEffect(() => {
    if (existingContact) {
      setFormData({
        name: existingContact.name,
        email: existingContact.email || '',
        phone: existingContact.phone || '',
        company: existingContact.company || '',
        notes: existingContact.notes || '',
      });
    }
  }, [existingContact]);

  const { error, isSubmitting, handleSubmit } = useFormSubmission<
    CreateContactData | UpdateContactData,
    Contact
  >({
    onSubmit: async (data) => {
      if (isEditing) {
        return await updateContact.mutateAsync({ id: contactId, data: data as UpdateContactData });
      } else {
        return await createContact.mutateAsync(data as CreateContactData);
      }
    },
    onSuccess: (contact) => {
      return `/contacts/${contact.id}`;
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
      notes: formData.notes.trim() || null,
    };
    handleSubmit(e, data);
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton to={isEditing ? `/contacts/${contactId}` : '/contacts'} />
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Contact' : 'New Contact'}
          </h1>
          <p className="text-dark-400 mt-1">
            {isEditing ? 'Update contact information' : 'Add a new contact to your CRM'}
          </p>
        </div>
      </div>

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

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes about this contact..."
            rows={4}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <Link to={isEditing ? `/contacts/${contactId}` : '/contacts'}>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Saving...
                </span>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Contact'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

