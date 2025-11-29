import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Plus, Edit, Trash2, Power, QrCode, Upload } from 'lucide-react';

interface PaymentSetting {
    id: number;
    payment_method: string;
    payment_method_name: string;
    qr_code_path: string | null;
    qr_code_url: string | null;
    account_name: string | null;
    account_number: string | null;
    instructions: string | null;
    is_active: boolean;
    display_order: number;
}

interface Props {
    settings: PaymentSetting[];
}

export default function PaymentSettings({ settings }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSetting, setEditingSetting] = useState<PaymentSetting | null>(null);
    const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        payment_method: '',
        qr_code: null as File | null,
        account_name: '',
        account_number: '',
        instructions: '',
        is_active: true,
        display_order: 0,
    });

    const isCashMethod = data.payment_method === 'cash';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('qr_code', file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setQrCodePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSetting) {
            router.post(
                route('super-admin.payment-settings.update', editingSetting.id),
                {
                    _method: 'PUT',
                    ...data,
                },
                {
                    forceFormData: true,
                    onSuccess: () => {
                        setEditingSetting(null);
                        setQrCodePreview(null);
                        reset();
                    },
                }
            );
        } else {
            post(route('super-admin.payment-settings.store'), {
                forceFormData: true,
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    setQrCodePreview(null);
                    reset();
                },
            });
        }
    };

    const handleEdit = (setting: PaymentSetting) => {
        setEditingSetting(setting);
        setData({
            payment_method: setting.payment_method,
            qr_code: null,
            account_name: setting.account_name || '',
            account_number: setting.account_number || '',
            instructions: setting.instructions || '',
            is_active: setting.is_active,
            display_order: setting.display_order,
        });
        setQrCodePreview(setting.qr_code_url);
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this payment setting?')) {
            router.delete(route('super-admin.payment-settings.destroy', id));
        }
    };

    const handleToggleActive = (id: number) => {
        router.patch(route('super-admin.payment-settings.toggle-active', id));
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setEditingSetting(null);
        setQrCodePreview(null);
        reset();
    };

    return (
        <AppSidebarLayout>
            <Head title="Payment Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Payment Settings</h1>
                        <p className="text-muted-foreground">
                            Manage QR codes and payment methods for customers
                        </p>
                    </div>
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Payment Method
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add Payment Method</DialogTitle>
                                <DialogDescription>
                                    {isCashMethod
                                        ? 'Configure instructions for cash payments. QR code and account fields are not required for cash.'
                                        : 'Add a new payment method with QR code for customers'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="payment_method">Payment Method *</Label>
                                    <select
                                        id="payment_method"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                                        value={data.payment_method}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                        required
                                    >
                                        <option value="">Select payment method</option>
                                        <option value="cash">Cash (On Delivery / Pickup)</option>
                                        <option value="gcash">GCash</option>
                                        <option value="maya">Maya (PayMaya)</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                    </select>
                                    {errors.payment_method && (
                                        <p className="text-sm text-red-600">{errors.payment_method}</p>
                                    )}
                                </div>

                                {!isCashMethod && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="qr_code">QR Code Image</Label>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    id="qr_code"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="flex-1"
                                                />
                                                <Upload className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            {qrCodePreview && (
                                                <div className="mt-2">
                                                    <img
                                                        src={qrCodePreview}
                                                        alt="QR Code Preview"
                                                        className="h-48 w-48 rounded-lg border object-contain"
                                                    />
                                                </div>
                                            )}
                                            {errors.qr_code && (
                                                <p className="text-sm text-red-600">{errors.qr_code}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="account_name">Account Name</Label>
                                            <Input
                                                id="account_name"
                                                value={data.account_name}
                                                onChange={(e) => setData('account_name', e.target.value)}
                                                placeholder="e.g., Rovic Meat Shop"
                                            />
                                            {errors.account_name && (
                                                <p className="text-sm text-red-600">{errors.account_name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="account_number">Account Number</Label>
                                            <Input
                                                id="account_number"
                                                value={data.account_number}
                                                onChange={(e) => setData('account_number', e.target.value)}
                                                placeholder="e.g., 09XX XXX XXXX"
                                            />
                                            {errors.account_number && (
                                                <p className="text-sm text-red-600">{errors.account_number}</p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="instructions">Payment Instructions</Label>
                                    <Textarea
                                        id="instructions"
                                        value={data.instructions}
                                        onChange={(e) => setData('instructions', e.target.value)}
                                        placeholder={isCashMethod
                                            ? 'e.g., Customer will pay in cash upon delivery or pickup.'
                                            : 'e.g., Scan QR code using GCash app and upload screenshot of payment confirmation'}
                                        rows={4}
                                    />
                                    {errors.instructions && (
                                        <p className="text-sm text-red-600">{errors.instructions}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="display_order">Display Order</Label>
                                    <Input
                                        id="display_order"
                                        type="number"
                                        value={data.display_order}
                                        onChange={(e) => setData('display_order', parseInt(e.target.value))}
                                        min="0"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="is_active" className="cursor-pointer">
                                        Active (visible to customers)
                                    </Label>
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving...' : 'Save Payment Method'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={closeModal}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Payment Settings Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {settings.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <QrCode className="mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="text-lg font-semibold">No payment methods configured</h3>
                                <p className="text-sm text-muted-foreground">
                                    Add your first payment method to start accepting QR code payments
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        settings.map((setting) => (
                            <Card key={setting.id} className={!setting.is_active ? 'opacity-60' : ''}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <QrCode className="h-5 w-5" />
                                                {setting.payment_method_name}
                                            </CardTitle>
                                            <CardDescription>
                                                {setting.is_active ? 'Active' : 'Inactive'}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleToggleActive(setting.id)}
                                            >
                                                <Power
                                                    className={`h-4 w-4 ${setting.is_active ? 'text-green-600' : 'text-gray-400'}`}
                                                />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {setting.qr_code_url && (
                                        <div className="flex justify-center">
                                            <img
                                                src={setting.qr_code_url}
                                                alt="QR Code"
                                                className="h-32 w-32 rounded-lg border object-contain"
                                            />
                                        </div>
                                    )}
                                    {setting.account_name && (
                                        <div>
                                            <p className="text-sm font-medium">Account Name:</p>
                                            <p className="text-sm text-muted-foreground">
                                                {setting.account_name}
                                            </p>
                                        </div>
                                    )}
                                    {setting.account_number && (
                                        <div>
                                            <p className="text-sm font-medium">Account Number:</p>
                                            <p className="text-sm text-muted-foreground">
                                                {setting.account_number}
                                            </p>
                                        </div>
                                    )}
                                    {setting.instructions && (
                                        <div>
                                            <p className="text-sm font-medium">Instructions:</p>
                                            <p className="text-sm text-muted-foreground line-clamp-3">
                                                {setting.instructions}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => handleEdit(setting)}
                                        >
                                            <Edit className="mr-1 h-3 w-3" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(setting.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Edit Modal */}
                <Dialog open={!!editingSetting} onOpenChange={(open) => !open && closeModal()}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Payment Method</DialogTitle>
                            <DialogDescription>
                                {isCashMethod
                                    ? 'Update instructions for cash payments. QR code and account fields are not required for cash.'
                                    : 'Update payment method settings and QR code'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_payment_method">Payment Method *</Label>
                                <select
                                    id="edit_payment_method"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value)}
                                    required
                                >
                                    <option value="">Select payment method</option>
                                    <option value="cash">Cash (On Delivery / Pickup)</option>
                                    <option value="gcash">GCash</option>
                                    <option value="maya">Maya (PayMaya)</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>

                            {!isCashMethod && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_qr_code">QR Code Image</Label>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id="edit_qr_code"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="flex-1"
                                            />
                                            <Upload className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        {qrCodePreview && (
                                            <div className="mt-2">
                                                <img
                                                    src={qrCodePreview}
                                                    alt="QR Code Preview"
                                                    className="h-48 w-48 rounded-lg border object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit_account_name">Account Name</Label>
                                        <Input
                                            id="edit_account_name"
                                            value={data.account_name}
                                            onChange={(e) => setData('account_name', e.target.value)}
                                            placeholder="e.g., Rovic Meat Shop"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit_account_number">Account Number</Label>
                                        <Input
                                            id="edit_account_number"
                                            value={data.account_number}
                                            onChange={(e) => setData('account_number', e.target.value)}
                                            placeholder="e.g., 09XX XXX XXXX"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="edit_instructions">Payment Instructions</Label>
                                <Textarea
                                    id="edit_instructions"
                                    value={data.instructions}
                                    onChange={(e) => setData('instructions', e.target.value)}
                                    placeholder={isCashMethod
                                        ? 'e.g., Customer will pay in cash upon delivery or pickup.'
                                        : 'e.g., Scan QR code using GCash app'}
                                    rows={4}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_display_order">Display Order</Label>
                                <Input
                                    id="edit_display_order"
                                    type="number"
                                    value={data.display_order}
                                    onChange={(e) => setData('display_order', parseInt(e.target.value))}
                                    min="0"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="edit_is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <Label htmlFor="edit_is_active" className="cursor-pointer">
                                    Active (visible to customers)
                                </Label>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Update Payment Method'}
                                </Button>
                                <Button type="button" variant="outline" onClick={closeModal}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppSidebarLayout>
    );
}
