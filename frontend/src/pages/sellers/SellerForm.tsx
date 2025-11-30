import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSeller, useCreateSeller, useUpdateSeller } from '../../api/sellers';
import { Button, Card, Input, LoadingSpinner, BackButton, ErrorMessage } from '../../components/ui';
import { useFormSubmission } from '../../hooks/useFormSubmission';
import type { Seller, CreateSellerData, UpdateSellerData } from '../../api/types';
import { config } from '../../config';

export default function SellerForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const sellerId = id ? parseInt(id, 10) : 0;

  const { data: existingSeller, isLoading } = useSeller(sellerId);
  const createSeller = useCreateSeller();
  const updateSeller = useUpdateSeller();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (existingSeller) {
      setFormData({
        name: existingSeller.name,
        email: existingSeller.email,
        password: '',
      });
    }
  }, [existingSeller]);

  const { error, isSubmitting, handleSubmit } = useFormSubmission<
    CreateSellerData | UpdateSellerData,
    Seller
  >({
    onSubmit: async (data) => {
      if (isEditing) {
        return await updateSeller.mutateAsync({ id: sellerId, data: data as UpdateSellerData });
      } else {
        return await createSeller.mutateAsync(data as CreateSellerData);
      }
    },
    onSuccess: () => {
      return '/sellers';
    },
    validate: (data) => {
      if (!data.name?.trim()) {
        return 'Name is required';
      }
      if (!data.email?.trim()) {
        return 'Email is required';
      }
      // For create, password is required
      if (!isEditing) {
        const createData = data as CreateSellerData;
        if (!createData.password) {
          return 'Password is required';
        }
        if (createData.password.length < 6) {
          return 'Password must be at least 6 characters';
        }
      } else {
        // For update, password is optional but must be >= 6 chars if provided
        const updateData = data as UpdateSellerData;
        if (updateData.password && updateData.password.length < 6) {
          return 'Password must be at least 6 characters';
        }
      }
      return null;
    },
  });

  const onSubmit = (e: FormEvent) => {
    const data: CreateSellerData | UpdateSellerData = isEditing
      ? {
          name: formData.name.trim(),
          email: formData.email.trim(),
          ...(formData.password && { password: formData.password }),
        }
      : {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        };
    handleSubmit(e, data);
  };

  const fillSampleData = () => {
    setFormData({
      name: 'Sven Karlsson',
      email: 'sven.karlsson@gmail.com',
      password: 'seller123',
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
        <BackButton to="/sellers" />
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Seller' : 'New Seller'}
          </h1>
          <p className="text-dark-400 mt-1">
            {isEditing ? 'Update seller information' : 'Create a new seller account'}
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

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@company.com"
            required
          />

          <Input
            label={isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required={!isEditing}
          />

          {!isEditing && (
            <p className="text-sm text-dark-500">
              Password must be at least 6 characters
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <Link to="/sellers">
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
                'Create Seller'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

