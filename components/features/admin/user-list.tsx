'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logger } from '@/lib/logger'
import { apiClient } from '@/lib/api/client'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { showApiErrorToast } from '@/lib/utils/toast-helpers'
import { UserDetailsModal } from '@/components/features/modals/user-details-modal'
import { formatRelativeTime, getInitials } from '@/lib/utils/formatters'
import { filterBySearch, sortBy as sortByField, sortByDate } from '@/lib/utils/filters'

interface User {
  id: string
  name?: string
  email: string
  image?: string
  createdAt: string
  lastLogin?: string
  documentsCount: number
  isActive: boolean
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'lastLogin'>('lastLogin')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchUsers = async () => {
    try {
      const data = await apiClient.get<{ users: User[] }>('/api/admin/users')
      setUsers(data.users)
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch users')
      showApiErrorToast('Failed to load users', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId)
    setModalOpen(true)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = (() => {
    // Filter by search term
    const searched = filterBySearch(users, searchTerm, ['name', 'email']);

    // Sort by selected field
    switch (sortBy) {
      case 'name':
      case 'email':
        return sortByField(searched, sortBy, 'asc');
      case 'createdAt':
      case 'lastLogin':
        return sortByDate(searched, sortBy, 'desc');
      default:
        return searched;
    }
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 sm:max-w-sm"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="lastLogin">Last Login</option>
          <option value="createdAt">Registration Date</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
        </select>
      </div>

      {/* Desktop Table View */}
      <ErrorBoundary
        level="component"
        fallback={
          <div className="p-4 text-center text-sm text-muted-foreground">
            Failed to load user table
          </div>
        }
        enableRetry
      >
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="flex items-center space-x-3">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name || user.email}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium">
                      {getInitials(user.name || user.email)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{user.name || 'No Name'}</div>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>{user.documentsCount}</TableCell>
                <TableCell>
                  {formatRelativeTime(user.createdAt)}
                </TableCell>
                <TableCell>
                  {user.lastLogin ? (
                    <span className="text-sm">
                      {formatRelativeTime(user.lastLogin)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewUser(user.id)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </ErrorBoundary>

      {/* Mobile Card View */}
      <ErrorBoundary
        level="component"
        fallback={
          <div className="p-4 text-center text-sm text-muted-foreground">
            Failed to load user cards
          </div>
        }
        enableRetry
      >
      <div className="lg:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="border rounded-lg p-4 space-y-3">
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
              <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
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
                <span className="ml-1 font-medium text-xs">
                  {formatRelativeTime(user.createdAt)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">Last Login:</span>
                <span className="ml-1 font-medium">
                  {user.lastLogin ? formatRelativeTime(user.lastLogin) : 'Never'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewUser(user.id)}
              >
                View
              </Button>
            </div>
          </div>
        ))}
      </div>
      </ErrorBoundary>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <span>Total: {filteredUsers.length} users</span>
        <span>Active: {filteredUsers.filter(u => u.isActive).length} users</span>
      </div>

      {selectedUserId && (
        <UserDetailsModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          userId={selectedUserId}
        />
      )}
    </div>
  )
}