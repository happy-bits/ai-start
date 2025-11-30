import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSellers, useDeleteSeller } from '../../api/sellers';
import { Button, Card, Badge, LoadingSpinner, EmptyState, Avatar, SearchInput } from '../../components/ui';
import { formatDate } from '../../utils';

export default function SellerList() {
  const { data: sellers = [], isLoading } = useSellers();
  const deleteSeller = useDeleteSeller();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSellers = sellers.filter(
    (seller) =>
      seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    deleteSeller.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sellers</h1>
          <p className="text-dark-400 mt-1">Manage seller accounts</p>
        </div>
        <Link to="/sellers/new">
          <Button>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Seller
          </Button>
        </Link>
      </div>

      {/* Search */}
      <SearchInput
        placeholder="Search sellers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Seller list */}
      <Card padding="none">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : filteredSellers.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            title="No sellers found"
            message={searchTerm ? 'Try a different search term' : 'Get started by adding your first seller'}
            action={!searchTerm ? (
              <Link to="/sellers/new">
                <Button size="sm">Add Seller</Button>
              </Link>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar name={seller.name} size="md" gradient="warm" />
                        <p className="text-sm font-medium text-white">{seller.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-dark-300">{seller.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="warm">Seller</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-dark-400">
                        {formatDate(seller.createdAt)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/sellers/${seller.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(seller.id)}
                          disabled={deleteSeller.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

