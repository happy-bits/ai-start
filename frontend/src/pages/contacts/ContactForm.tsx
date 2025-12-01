import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { useCreateContact } from '../../api/contacts';
import { Button, Card, Input, LoadingSpinner, BackButton, ErrorMessage } from '../../components/ui';
import { config } from '../../config';
import { useFormSubmission } from '../../hooks/useFormSubmission';

import type { Contact, CreateContactData } from '../../api/types';

export default function ContactForm() {
  const createContact = useCreateContact();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
  });

  const { error, isSubmitting, handleSubmit } = useFormSubmission<
    CreateContactData,
    Contact
  >({
    onSubmit: async (data) => {
      return await createContact.mutateAsync(data as CreateContactData);
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
      company: formData.company.trim() || null,
    };
    handleSubmit(e, data);
  };

  const fillSampleData = () => {
    setFormData({
      name: 'Mikael Pettersson',
      email: 'mikael.petterson@volvo.com',
      company: 'Volvo AB',
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton to="/contacts" />
        <div>
          <h1 className="text-2xl font-bold text-white">New Contact</h1>
          <p className="text-dark-400 mt-1">Add a new contact to your CRM</p>
        </div>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-6">
          <ErrorMessage error={error} />

          {/* Developer Tools: Fill Sample Data */}
          {config.developerTools && (
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

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@company.com"
          />

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
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Creating...
                </span>
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

