import { type FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useContact, useCreateContact, useUpdateContact } from '../../api/contacts';
import type { Contact, CreateContactData, UpdateContactData } from '../../api/types';
import { BackButton, Button, Card, ErrorMessage, Input, LoadingSpinner } from '../../components/ui';
import { config } from '../../config';
import { useFormSubmission } from '../../hooks/useFormSubmission';

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
    linkedin: '',
    company: '',
  });

  useEffect(() => {
    if (existingContact) {
      setFormData({
        name: existingContact.name,
        email: existingContact.email || '',
        phone: existingContact.phone || '',
        linkedin: existingContact.linkedin || '',
        company: existingContact.company || '',
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
    onSuccess: () => {
      return '/contacts';
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
      linkedin: formData.linkedin.trim() || null,
      company: formData.company.trim() || null,
    };
    handleSubmit(e, data);
  };

  const fillSampleData = () => {
    setFormData({
      name: 'Mikael Pettersson',
      email: 'mikael.petterson@volvo.com',
      phone: '+46 70 123 45 67',
      linkedin: 'mikael-pettersson',
      company: 'Volvo AB',
    });
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
        <BackButton to="/contacts" />
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

          {/* Developer Tools: Fill Sample Data */}
          {config.developerTools && !isEditing && (
            <div className="mb-4 pb-4 border-b border-dark-700">
              <button
                type="button"
                onClick={fillSampleData}
                className="text-xs text-dark-400 hover:text-warm-400 transition-colors"
              >
                Fill sample data
              </button>
            </div>
          )}

          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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

            <Input
              label="LinkedIn"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              placeholder="username"
            />
          </div>

          <Input
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Acme Inc."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <Link to="/contacts">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
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
