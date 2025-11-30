import { Link } from 'react-router-dom';
import { useCustomers } from '../api/customers';
import { useInteractions } from '../api/interactions';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: interactions = [], isLoading: interactionsLoading } = useInteractions();

  // Calculate stats
  const totalCustomers = customers.length;
  const totalInteractions = interactions.length;
  const recentInteractions = interactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const interactionsByType = interactions.reduce(
    (acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const isLoading = customersLoading || interactionsLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-2 text-dark-400">
          Here's what's happening with your customers today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-warm-500/5 rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warm-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-dark-400">Total Customers</p>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? '...' : totalCustomers}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-dark-400">Total Interactions</p>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? '...' : totalInteractions}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-dark-400">Calls</p>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? '...' : interactionsByType['call'] || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-dark-400">Meetings</p>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? '...' : interactionsByType['meeting'] || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Customers</h2>
            <Link
              to="/customers"
              className="text-sm text-warm-400 hover:text-warm-300 transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-dark-700" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-dark-700 rounded" />
                      <div className="h-3 w-24 bg-dark-700 rounded mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : customers.length === 0 ? (
              <p className="text-dark-500 text-sm">No customers yet</p>
            ) : (
              customers.slice(0, 5).map((customer) => (
                <Link
                  key={customer.id}
                  to={`/customers/${customer.id}`}
                  className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-dark-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-warm-500 to-warm-600 flex items-center justify-center text-white font-medium">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {customer.name}
                    </p>
                    <p className="text-xs text-dark-500 truncate">
                      {customer.company || customer.email || 'No details'}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Recent Interactions */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Interactions</h2>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-dark-700" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-dark-700 rounded" />
                      <div className="h-3 w-24 bg-dark-700 rounded mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentInteractions.length === 0 ? (
              <p className="text-dark-500 text-sm">No interactions yet</p>
            ) : (
              recentInteractions.map((interaction) => {
                const customer = customers.find((c) => c.id === interaction.customerId);
                const typeColors = {
                  call: 'bg-emerald-500/10 text-emerald-400',
                  meeting: 'bg-purple-500/10 text-purple-400',
                  email: 'bg-blue-500/10 text-blue-400',
                };
                const typeIcons = {
                  call: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  ),
                  meeting: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  email: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                };

                return (
                  <div
                    key={interaction.id}
                    className="flex items-center gap-4 p-3 -mx-3 rounded-lg"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[interaction.type]}`}
                    >
                      {typeIcons[interaction.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {customer?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-dark-500">
                        {interaction.date} {interaction.time && `at ${interaction.time}`}
                      </p>
                    </div>
                    <span className="text-xs text-dark-400 capitalize">
                      {interaction.type}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

