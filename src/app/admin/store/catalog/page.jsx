// @/app/admin/store/catalog/page.jsx

'use client';

import { ArrowUpDown, Image, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminHeader from '@/components/admin/AdminHeader';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { create, getAll, remove, update } from '@/lib/client/query';
import { useTableState } from '../hooks/useTableState';
import { CatalogItemForm } from './CatalogItemForm';

const initialFormData = {
    type: 'physical',
    name: '', // Will be converted to multi-language object
    nameML: {}, // Multi-language names: { en: 'Name', fr: 'Nom' }
    slug: '',
    sku: '',
    description: '', // Will be converted to multi-language object
    descriptionML: {}, // Multi-language descriptions
    price: 0,
    compareAtPrice: 0,
    categoryId: '',
    collections: [],
    images: [],
    coverImageIndex: 0,
    weight: 0,
    stock: 0,
    lowStockAlert: 5,
    downloadLink: '',
    downloadNotes: '',
    duration: 60,
    hasDuration: true,
    durationUnit: 'minutes',
    serviceType: 'standard',
    deliveryMethod: 'in-person',
    platform: '',
    maxParticipants: 1,
    hasCapacityLimit: true,
    prerequisites: '',
    serviceIncludes: '',
    serviceNotes: '',
    requiresAppointment: false,
    appointmentSettings: {
        allowOnlineBooking: true,
        bufferTime: 15, // minutes between appointments
        advanceBookingDays: 30, // how far in advance customers can book
        workingHours: {
            monday: { enabled: true, start: '09:00', end: '17:00' },
            tuesday: { enabled: true, start: '09:00', end: '17:00' },
            wednesday: { enabled: true, start: '09:00', end: '17:00' },
            thursday: { enabled: true, start: '09:00', end: '17:00' },
            friday: { enabled: true, start: '09:00', end: '17:00' },
            saturday: { enabled: false, start: '09:00', end: '17:00' },
            sunday: { enabled: false, start: '09:00', end: '17:00' }
        }
    },
    customAttributes: [],
    // Variant system for attributes with individual stock and images
    variants: [], // [{ attributes: {color: 'black'}, stock: 10, price: 0, sku: '', coverImage: null }]
    hasVariants: false,
    // SEO fields with multi-language support
    seo: {
        metaTitle: '',
        metaTitleML: {},
        metaDescription: '',
        metaDescriptionML: {},
        metaKeywords: '',
        metaKeywordsML: {},
        ogTitle: '',
        ogTitleML: {},
        ogDescription: '',
        ogDescriptionML: {},
        ogImage: '',
        twitterTitle: '',
        twitterTitleML: {},
        twitterDescription: '',
        twitterDescriptionML: {},
        twitterImage: ''
    },
    isActive: true,
    featured: false
};

export default function CatalogPage() {
    const {
        items: catalog,
        setItems: setCatalog,
        loading,
        setLoading,
        search,
        setSearch,
        currentPage,
        setCurrentPage,
        sortConfig,
        handleSort,
        getFilteredAndSortedItems,
        getPaginatedItems,
        totalPages,
        filteredItems,
        paginatedItems
    } = useTableState();

    const [categories, setCategories] = useState([]);
    const [collections, setCollections] = useState([]);
    const [availableLanguages, setAvailableLanguages] = useState(['en']);
    const [defaultLanguage, setDefaultLanguage] = useState('en');
    const [isOpen, setIsOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [storeSettings, setStoreSettings] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [catalogRes, categoriesRes, collectionsRes, storeRes, settingsRes] = await Promise.all([
                getAll('catalog'),
                getAll('categories'),
                getAll('collections'),
                getAll('store_settings'),
                getAll('site_settings')
            ]);

            if (catalogRes.success) {
                setCatalog(catalogRes.data);
            }
            if (categoriesRes.success) {
                setCategories(categoriesRes.data);
            }
            if (collectionsRes.success) {
                setCollections(collectionsRes.data);
            }
            if (storeRes.success) {
                setStoreSettings(storeRes.data);
            }
            if (settingsRes.success && settingsRes.data.length > 0) {
                const settings = settingsRes.data[0];
                setAvailableLanguages(settings.availableLanguages || ['en']);
                setDefaultLanguage(settings.language || 'en');
            }
        } catch (_error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    const handleImageUpload = async (files) => {
        if (uploadingImages) {
            toast.error('Please wait for the current upload to finish');
            return;
        }

        setUploadingImages(true);
        setUploadProgress(0);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + Math.random() * 20;
            });
        }, 200);

        const uploadedImages = [];
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload image files only');
                continue;
            }

            if (file.size > 10 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large (max 10MB)`);
                continue;
            }

            const uploadFormData = new FormData();
            uploadFormData.append('files', file);
            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData
                });
                const data = await response.json();
                if (data.success && data.data?.[0]) {
                    uploadedImages.push({
                        url: data.data[0].publicUrl,
                        alt: file.name
                    });
                } else {
                    toast.error(`Failed to upload ${file.name}`);
                }
            } catch (error) {
                console.error('Upload error:', error);
                toast.error(`Failed to upload ${file.name}: ${error.message}`);
            }
        }

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (uploadedImages.length > 0) {
            setFormData((prev) => ({
                ...prev,
                images: [...prev.images, ...uploadedImages]
            }));
            toast.success(`Successfully uploaded ${uploadedImages.length} image(s)`);
        }

        setTimeout(() => {
            setUploadingImages(false);
            setUploadProgress(0);
        }, 800);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Check for slug uniqueness
            if (formData.slug) {
                const existingItems = catalog.filter(
                    (item) => item.slug === formData.slug && (!editItem || item.id !== editItem.id)
                );

                if (existingItems.length > 0) {
                    toast.error('Slug already exists. Please choose a different slug.');
                    setIsSubmitting(false);
                    return;
                }
            }

            const processedData = {
                ...formData
            };

            if (editItem) {
                const _updatedItem = await update(editItem.id, processedData, 'catalog');
                toast.success('Item successfully updated!');
                setCatalog((prev) =>
                    prev.map((item) => (item.id === editItem.id ? { ...item, ...processedData } : item))
                );
            } else {
                const newItem = await create(processedData, 'catalog');
                toast.success('Item successfully created!');
                setCatalog((prev) => [...prev, newItem]);
            }

            setIsOpen(false);
            setFormData(initialFormData);
            setEditItem(null);
        } catch (error) {
            console.error('Error saving item:', error);
            toast.error(error.message || 'Failed to save item');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (product) => {
        setEditItem(product);
        setFormData({
            ...initialFormData,
            ...product,
            // Ensure all fields are properly set
            slug: product.slug || '',
            // Handle multi-language fields - backwards compatibility
            nameML: product.nameML || (product.name ? { [defaultLanguage]: product.name } : {}),
            descriptionML:
                product.descriptionML || (product.description ? { [defaultLanguage]: product.description } : {}),
            collections: product.collections || [],
            images: product.images || [],
            customAttributes: product.customAttributes || [],
            categoryId: product.categoryId || '',
            // Variant system
            variants: product.variants || [],
            hasVariants: product.hasVariants || false,
            // SEO fields with proper structure and multi-language support
            seo: {
                metaTitle: product.seo?.metaTitle || '',
                metaTitleML:
                    product.seo?.metaTitleML ||
                    (product.seo?.metaTitle ? { [defaultLanguage]: product.seo.metaTitle } : {}),
                metaDescription: product.seo?.metaDescription || '',
                metaDescriptionML:
                    product.seo?.metaDescriptionML ||
                    (product.seo?.metaDescription ? { [defaultLanguage]: product.seo.metaDescription } : {}),
                metaKeywords: product.seo?.metaKeywords || '',
                metaKeywordsML:
                    product.seo?.metaKeywordsML ||
                    (product.seo?.metaKeywords ? { [defaultLanguage]: product.seo.metaKeywords } : {}),
                ogTitle: product.seo?.ogTitle || '',
                ogTitleML:
                    product.seo?.ogTitleML || (product.seo?.ogTitle ? { [defaultLanguage]: product.seo.ogTitle } : {}),
                ogDescription: product.seo?.ogDescription || '',
                ogDescriptionML:
                    product.seo?.ogDescriptionML ||
                    (product.seo?.ogDescription ? { [defaultLanguage]: product.seo.ogDescription } : {}),
                ogImage: product.seo?.ogImage || '',
                twitterTitle: product.seo?.twitterTitle || '',
                twitterTitleML:
                    product.seo?.twitterTitleML ||
                    (product.seo?.twitterTitle ? { [defaultLanguage]: product.seo.twitterTitle } : {}),
                twitterDescription: product.seo?.twitterDescription || '',
                twitterDescriptionML:
                    product.seo?.twitterDescriptionML ||
                    (product.seo?.twitterDescription ? { [defaultLanguage]: product.seo.twitterDescription } : {}),
                twitterImage: product.seo?.twitterImage || ''
            },
            // Ensure numeric fields are properly handled
            price: product.price || 0,
            compareAtPrice: product.compareAtPrice || 0,
            weight: product.weight || 0,
            stock: product.stock || 0,
            lowStockAlert: product.lowStockAlert || 5,
            duration: product.duration || 60,
            coverImageIndex: product.coverImageIndex || 0,
            featured: product.featured || false
        });
        setIsOpen(true);
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await remove(itemToDelete.id, 'catalog');
            toast.success('Item deleted successfully');
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            fetchData();
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to delete item');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        setIsDeleting(false);
    };

    const formatPrice = (price) => {
        const currency = storeSettings?.currency || 'EUR';
        const locale = currency === 'EUR' ? 'fr-FR' : currency === 'USD' ? 'en-US' : 'en-GB';

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(price);
    };

    return (
        <div className="space-y-4">
            <AdminHeader title="Items" description="Manage your catalog items">
                <Dialog
                    open={isOpen}
                    onOpenChange={(open) => {
                        setIsOpen(open);
                        if (!open) {
                            setEditItem(null);
                            setFormData(initialFormData);
                        }
                    }}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                setEditItem(null);
                                setFormData(initialFormData);
                            }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[90vw] max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>{editItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                        </DialogHeader>
                        <CatalogItemForm
                            formData={formData}
                            setFormData={setFormData}
                            editItem={editItem}
                            categories={categories}
                            collections={collections}
                            availableLanguages={availableLanguages}
                            defaultLanguage={defaultLanguage}
                            onSubmit={handleSubmit}
                            onImageUpload={handleImageUpload}
                            isSubmitting={isSubmitting}
                            uploadingImages={uploadingImages}
                            uploadProgress={uploadProgress}
                        />
                    </DialogContent>
                </Dialog>
            </AdminHeader>
            {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : (
                <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <Input
                                placeholder="Search items..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="max-w-xs"
                            />
                        </div>
                        <ScrollArea className="h-[calc(100vh-250px)]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Image</TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort('name')}
                                                className="h-auto p-0 font-medium hover:bg-transparent">
                                                Name
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort('price')}
                                                className="h-auto p-0 font-medium hover:bg-transparent">
                                                Price
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort('stock')}
                                                className="h-auto p-0 font-medium hover:bg-transparent">
                                                Stock Status
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center">
                                                No items found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    {item.images && item.images.length > 0 ? (
                                                        <img
                                                            src={
                                                                item.images[
                                                                    item.coverImageIndex >= 0 ? item.coverImageIndex : 0
                                                                ]?.url || item.images[0]?.url
                                                            }
                                                            alt={item.name}
                                                            className="h-10 w-10 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                                                            <Image className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {item.nameML?.[defaultLanguage] || item.name || 'Untitled'}
                                                        </div>
                                                        <div className="text-muted-foreground text-sm">
                                                            {(() => {
                                                                const description =
                                                                    item.descriptionML?.[defaultLanguage] ||
                                                                    item.description ||
                                                                    '';
                                                                return description.length > 50
                                                                    ? `${description.substring(0, 50)}...`
                                                                    : description || 'No description';
                                                            })()}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatPrice(item.price)}</TableCell>
                                                <TableCell>
                                                    {categories.find((c) => c.id === item.categoryId)?.name ||
                                                        'Uncategorized'}
                                                </TableCell>
                                                <TableCell>
                                                    {item.hasVariants && item.variants?.length > 0 ? (
                                                        <div className="space-y-1">
                                                            <span className="text-muted-foreground text-xs">
                                                                {item.variants.length} variant
                                                                {item.variants.length !== 1 ? 's' : ''}
                                                            </span>
                                                            <div>
                                                                {item.variants.some(
                                                                    (v) => v.stock > 0 || v.unlimitedStock
                                                                ) ? (
                                                                    <span className="rounded-full bg-green-100 px-2 py-1 text-green-800 text-xs">
                                                                        In Stock
                                                                    </span>
                                                                ) : (
                                                                    <span className="rounded-full bg-red-100 px-2 py-1 text-red-800 text-xs">
                                                                        Out of Stock
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className={`rounded-full px-2 py-1 text-xs ${
                                                                item.type === 'service' ||
                                                                item.type === 'digital' ||
                                                                item.stock > 0 ||
                                                                item.stock === -1
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {item.type === 'service' || item.type === 'digital'
                                                                ? item.isActive
                                                                    ? 'Available'
                                                                    : 'Not available'
                                                                : item.stock === -1
                                                                  ? 'Unlimited'
                                                                  : item.stock > 0
                                                                    ? 'In Stock'
                                                                    : 'Out of Stock'}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="space-x-2 text-right">
                                                    {/* Mobile view - show individual buttons */}
                                                    <div className="flex space-x-2 sm:hidden">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleEdit(item)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleDeleteClick(item)}
                                                            disabled={isDeleting && itemToDelete?.id === item.id}>
                                                            {isDeleting && itemToDelete?.id === item.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>

                                                    {/* Desktop view - show dropdown menu */}
                                                    <div className="hidden sm:block">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    disabled={
                                                                        isDeleting && itemToDelete?.id === item.id
                                                                    }>
                                                                    {isDeleting && itemToDelete?.id === item.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit Item
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeleteClick(item)}
                                                                    className="text-destructive focus:text-destructive">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete Item
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-4 flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                className={
                                                    currentPage === 1
                                                        ? 'pointer-events-none opacity-50'
                                                        : 'cursor-pointer'
                                                }
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    onClick={() => setCurrentPage(page)}
                                                    isActive={page === currentPage}
                                                    className="cursor-pointer">
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                className={
                                                    currentPage === totalPages
                                                        ? 'pointer-events-none opacity-50'
                                                        : 'cursor-pointer'
                                                }
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}

                        {/* Items count info */}
                        <div className="text-center text-muted-foreground text-sm">
                            Showing {paginatedItems.length} of {filteredItems.length} items
                            {search && ` (filtered from ${catalog.length} total)`}
                        </div>
                    </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Item</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone and
                            will permanently remove the item from your catalog.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Item'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
