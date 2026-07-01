import { type ReactNode, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Edit3, KeyRound, Plus, Trash2, UsersRound } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import PaginatedSearchTable from '@/components/ui/data-table';
import { useInitials } from '@/hooks/use-initials';
import { formatUserRole } from '@/lib/user-roles';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';

import PasswordForm from './partials/password-form';
import UserForm from './partials/user-form';
import { useDeleteUser, useFetchUsers } from './partials/user-hooks';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'User Management', href: '/manage-users' },
];

const emptyUser: User = {
    id: 0,
    username: '',
    full_name: '',
    delivery_unit: '',
    role: '',
    designation: '',
    task_description: '',
    email: '',
    email_verified_at: null,
    created_at: '',
    updated_at: '',
};

function UsersPage() {
    const { data = [], refetch, isFetching } = useFetchUsers();
    const [selectedUser, setSelectedUser] = useState<User>(emptyUser);
    const [selectedId, setSelectedId] = useState<number>(0);
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const deleteUser = useDeleteUser();
    const getInitials = useInitials();

    const openCreateForm = (): void => {
        setSelectedUser(emptyUser);
        setIsUserFormOpen(true);
    };

    const openUpdateForm = (user: User): void => {
        setSelectedUser(user);
        setIsUserFormOpen(true);
    };

    const confirmDelete = (): void => {
        deleteUser.mutate(
            { id: selectedId },
            {
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    toast.success('Account deleted successfully.');
                },
            },
        );
    };

    return (
        <>
            <Head title="User Management" />

            <div className="flex min-h-0 flex-1 flex-col gap-5 ">
                <section className="rounded-lg border border-sky-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 px-5 py-4 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                                <UsersRound className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-sky-50">User Management</h1>
                                <p className="text-sm text-slate-100">
                                    Manage reviewer accounts, roles, and username access.
                                </p>
                            </div>
                        </div>

                        <Button className="bg-sky-50 text-sky-600 hover:bg-sky-700" onClick={openCreateForm}>
                            <Plus className="size-4" />
                            Add Account
                        </Button>
                    </div>
                </section>

                <section className="overflow-hidden rounded-lg border border-sky-200 bg-white shadow-sm">
                    <PaginatedSearchTable<User>
                        items={data}
                        headers={[
                            { name: 'Account', position: 'left' },
                            { name: 'Username', position: 'center' },
                            { name: 'Delivery Unit', position: 'center' },
                            { name: 'Role', position: 'center' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        searchBy={(user) =>
                            `${user.full_name} ${user.username} ${user.delivery_unit} ${user.role} ${user.designation}`
                        }
                        renderRow={(user) => (
                            <tr key={user.id} className="border-b border-slate-100 transition-colors hover:bg-sky-50/70">
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10 border border-sky-200">
                                            <AvatarFallback className="bg-sky-100 text-sm font-semibold text-sky-700">
                                                {getInitials(user.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                {user.full_name}
                                            </p>
                                            <p className="truncate text-xs text-slate-500">{user.designation}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-center text-sm font-medium text-sky-700">
                                    {user.username}
                                </td>
                                <td className="px-6 py-3 text-center text-sm text-slate-600">{user.delivery_unit}</td>
                                <td className="px-6 py-3 text-center">
                                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                                        {formatUserRole(user.role)}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            popover="Edit user"
                                            aria-label="Edit user"
                                            className="text-sky-700 hover:bg-sky-100"
                                            onClick={() => openUpdateForm(user)}
                                        >
                                            <Edit3 className="size-4" />
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            popover="Change password"
                                            aria-label="Change password"
                                            className="text-amber-600 hover:bg-amber-50"
                                            onClick={() => {
                                                setSelectedId(user.id);
                                                setIsPasswordOpen(true);
                                            }}
                                        >
                                            <KeyRound className="size-4" />
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            popover="Delete user"
                                            aria-label="Delete user"
                                            className="text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                                setSelectedId(user.id);
                                                setIsDeleteOpen(true);
                                            }}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        itemsPerPage={10}
                        searchPlaceholder="Search users..."
                        onRefresh={() => {
                            void refetch();
                        }}
                        isLoading={isFetching}
                    />
                </section>
            </div>

            <UserForm data={selectedUser} show={isUserFormOpen} onClose={() => setIsUserFormOpen(false)} />
            <PasswordForm id={selectedId} show={isPasswordOpen} onClose={() => setIsPasswordOpen(false)} />
            <ConfirmationDialog
                show={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                type={2}
                onConfirm={confirmDelete}
                message="Are you sure you want to delete this account?"
            />
        </>
    );
}

UsersPage.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;

export default UsersPage;
