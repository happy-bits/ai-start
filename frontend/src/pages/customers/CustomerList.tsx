import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomers, useDeleteCustomer } from '../../api/customers';
import { Button, Card, LoadingSpinner, EmptyState, Avatar } from '../../components/ui';

export default function CustomerList() {
  const { data: customers = [], isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteCustomer.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-dark-400 mt-1">Manage your customer relationships</p>
        </div>
        <Link to="/customers/new">
          <Button>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card padding="sm">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-transparent transition-all"
          />
        </div>
      </Card>

      {/* Customer list */}
      <Card padding="none">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="No customers found"
            message={searchTerm ? 'Try a different search term' : 'Get started by adding your first customer'}
            action={!searchTerm ? (
              <Link to="/customers/new">
                <Button size="sm">Add Customer</Button>
              </Link>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/customers/${customer.id}`} className="flex items-center gap-4">
                        <Avatar name={customer.name} size="md" />
                        <div>
                          <p className="text-sm font-medium text-white hover:text-warm-400 transition-colors">
                            {customer.name}
                          </p>
                          {customer.notes && (
                            <p className="text-xs text-dark-500 truncate max-w-xs">
                              {customer.notes}
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <p className="text-sm text-dark-300">{customer.email}</p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-dark-400">{customer.phone}</p>
                        )}
                        {!customer.email && !customer.phone && (
                          <p className="text-sm text-dark-500">No contact info</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-dark-300">
                        {customer.company || <span className="text-dark-500">—</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/customers/${customer.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link to={`/customers/${customer.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer.id, customer.name)}
                          disabled={deleteCustomer.isPending}
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

