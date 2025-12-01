import { useParams, Link } from 'react-router-dom';

import { useContact } from '../../api/contacts';
import { 
  Button, 
  LoadingSpinner, 
  BackButton, 
  Avatar,
} from '../../components/ui';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const contactId = parseInt(id!, 10);

  const { data: contact, isLoading: contactLoading } = useContact(contactId);

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
    </div>
  );
}

