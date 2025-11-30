import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSeller, useCreateSeller, useUpdateSeller } from '../../api/sellers';
import { Button, Card, Input } from '../../components/ui';

export default function SellerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingSeller) {
      setFormData({
        name: existingSeller.name,
        email: existingSeller.email,
        password: '',
      });
    }
  }, [existingSeller]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!isEditing && !formData.password) {
      setError('Password is required');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      if (isEditing) {
        const data: { name?: string; email?: string; password?: string } = {
          name: formData.name.trim(),
          email: formData.email.trim(),
        };
        if (formData.password) {
          data.password = formData.password;
        }
        await updateSeller.mutateAsync({ id: sellerId, data });
      } else {
        await createSeller.mutateAsync({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });
      }
      navigate('/sellers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/sellers"
          className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
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
              disabled={createSeller.isPending || updateSeller.isPending}
            >
              {createSeller.isPending || updateSeller.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
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

