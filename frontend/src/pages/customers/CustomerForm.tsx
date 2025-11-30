import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCustomer, useCreateCustomer, useUpdateCustomer } from '../../api/customers';
import { Button, Card, Input, Textarea, LoadingSpinner, BackButton, ErrorMessage } from '../../components/ui';

export default function CustomerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const customerId = id ? parseInt(id, 10) : 0;

  const { data: existingCustomer, isLoading } = useCustomer(customerId);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingCustomer) {
      setFormData({
        name: existingCustomer.name,
        email: existingCustomer.email || '',
        phone: existingCustomer.phone || '',
        company: existingCustomer.company || '',
        notes: existingCustomer.notes || '',
      });
    }
  }, [existingCustomer]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    const data = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      company: formData.company.trim() || null,
      notes: formData.notes.trim() || null,
    };

    try {
      if (isEditing) {
        await updateCustomer.mutateAsync({ id: customerId, data });
        navigate(`/customers/${customerId}`);
      } else {
        const customer = await createCustomer.mutateAsync(data);
        navigate(`/customers/${customer.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
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
        <BackButton to={isEditing ? `/customers/${customerId}` : '/customers'} />
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Customer' : 'New Customer'}
          </h1>
          <p className="text-dark-400 mt-1">
            {isEditing ? 'Update customer information' : 'Add a new customer to your CRM'}
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
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
            placeholder="Any additional notes about this customer..."
            rows={4}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <Link to={isEditing ? `/customers/${customerId}` : '/customers'}>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createCustomer.isPending || updateCustomer.isPending}
            >
              {createCustomer.isPending || updateCustomer.isPending ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Saving...
                </span>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Customer'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

