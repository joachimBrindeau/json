'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserDetailsModal } from '@/components/features/modals/user-details-modal';
import { formatRelativeTime, getInitials } from '@/lib/utils/formatters';
import { useApiData } from '@/hooks/use-api-data';
import { ResponsiveTable, MobileCardProps } from '@/components/shared/responsive-table';
import { Column } from '@/components/shared/data-table';

interface User extends Record<string, unknown> {
  id: string;
  name?: string;
  email: string;
  image?: string;
  createdAt: string;
  lastLogin?: string;
  documentsCount: number;
  isActive: boolean;
}

// Mobile card component
function UserMobileCard({ item: user, onAction }: MobileCardProps<User>) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || user.email}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium">
              {getInitials(user.name || user.email)}
            </div>
          )}
          <div>
            <div className="font-medium text-sm">{user.name || 'No Name'}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
        <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Documents:</span>
          <span className="ml-1 font-medium">{user.documentsCount}</span>
        </div>
        <div>
          <span className="text-gray-500">Registered:</span>
          <span className="ml-1 font-medium text-xs">{formatRelativeTime(user.createdAt)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-500">Last Login:</span>
          <span className="ml-1 font-medium">
            {user.lastLogin ? formatRelativeTime(user.lastLogin) : 'Never'}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => onAction?.(user)}>
          View
        </Button>
      </div>
    </div>
  );
}

export function UserList() {
  const { data, loading } = useApiData<{ users: User[] }>({
    endpoint: '/api/admin/users',
    errorMessage: 'Failed to load users',
  });

  const users = data?.users || [];
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleViewUser = (user: User) => {
    setSelectedUserId(user.id);
    setModalOpen(true);
  };

  // Define table columns
  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'User',
      className: 'flex items-center space-x-3',
      render: (user) => (
        <>
          {user.image ? (
            <img src={user.image} alt={user.name || user.email} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium">
              {getInitials(user.name || user.email)}
            </div>
          )}
          <div>
            <div className="font-medium">{user.name || 'No Name'}</div>
          </div>
        </>
      ),
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (user) => (
        <Badge variant={user.isActive ? 'default' : 'secondary'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'documentsCount',
      label: 'Documents',
    },
    {
      key: 'createdAt',
      label: 'Registered',
      render: (user) => formatRelativeTime(user.createdAt),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (user) =>
        user.lastLogin ? (
          <span className="text-sm">{formatRelativeTime(user.lastLogin)}</span>
        ) : (
          <span className="text-sm text-gray-500">Never</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewUser(user);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <ResponsiveTable
        data={users}
        columns={columns}
        loading={loading}
        loadingMessage="Loading users..."
        emptyMessage="No users found"
        searchable
        searchPlaceholder="Search users..."
        searchFields={['name', 'email']}
        sortable
        sortOptions={[
          { value: 'lastLogin', label: 'Last Login', type: 'date' },
          { value: 'createdAt', label: 'Registration Date', type: 'date' },
          { value: 'name', label: 'Name', type: 'string' },
          { value: 'email', label: 'Email', type: 'string' },
        ]}
        defaultSortBy="lastLogin"
        mobileCard={UserMobileCard}
        onRowClick={handleViewUser}
        keyExtractor={(user) => user.id}
        summary={(filteredUsers) => (
          <>
            <span>Total: {filteredUsers.length} users</span>
            <span>Active: {filteredUsers.filter((u) => u.isActive).length} users</span>
          </>
        )}
      />

      {selectedUserId && (
        <UserDetailsModal open={modalOpen} onOpenChange={setModalOpen} userId={selectedUserId} />
      )}
    </>
  );
}
