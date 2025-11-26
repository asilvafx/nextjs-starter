// @/app/admin/store/categories/page.jsx

'use client';

import { Image as ImageIcon, Loader2, MoreHorizontal, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminHeader from '@/app/admin/components/AdminHeader';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { 
    getAllCollections, 
    getAllCatalog,
    createCollection, 
    updateCollection, 
    deleteCollection,
    getSiteSettings 
} from '@/lib/server/admin';

const initialFormData = {
    name: '',
    nameML: {}, // Multi-language names: { en: 'Name', fr: 'Nom' }
    slug: '',
    description: '',
    descriptionML: {}, // Multi-language descriptions
    imageUrl: '',
    isActive: true,
    products: []
};

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

export default function CollectionsPage() {
    const [collections, setCollections] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editCollection, setEditCollection] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [availableLanguages, setAvailableLanguages] = useState(['en']);
    const [defaultLanguage, setDefaultLanguage] = useState('en');
    const [currentLanguage, setCurrentLanguage] = useState('en');

    // Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    // Multi-language helper functions
    const updateMultiLanguageField = (fieldName, langCode, value) => {
        const mlField = `${fieldName}ML`;
        setFormData({
            ...formData,
            [mlField]: {
                ...formData[mlField],
                [langCode]: value
            },
            // Update the main field with default language value for backwards compatibility
            [fieldName]: langCode === defaultLanguage ? value : formData[fieldName]
        });
    };

    const getMultiLanguageValue = (fieldName, langCode) => {
        const mlField = `${fieldName}ML`;
        return formData[mlField]?.[langCode] || (langCode === defaultLanguage ? formData[fieldName] : '') || '';
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [collectionsRes, catalogRes, settingsRes] = await Promise.all([
                getAllCollections({
                    page: currentPage,
                    limit: itemsPerPage,
                    search: search
                }), 
                getAllCatalog(),
                getSiteSettings()
            ]);

            if (collectionsRes.success) {
                setCollections(collectionsRes.data);
                setTotalPages(collectionsRes.pagination.totalPages);
                setTotalItems(collectionsRes.pagination.totalItems);
            }
            if (catalogRes.success) setProducts(catalogRes.data);
            
            if (settingsRes.success && settingsRes.data) {
                const settings = settingsRes.data;
                setAvailableLanguages(settings.availableLanguages || ['en']);
                setDefaultLanguage(settings.language || 'en');
                setCurrentLanguage(settings.language || 'en');
            }
        } catch (_error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPage, search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Check for slug uniqueness
            if (formData.slug) {
                const existingCollections = collections.filter(
                    (collection) =>
                        collection.slug === formData.slug && (!editCollection || collection.id !== editCollection.id)
                );

                if (existingCollections.length > 0) {
                    toast.error('Slug already exists. Please choose a different slug.');
                    return;
                }
            }

            // Prepare multi-language name and description with fallback
            const nameML = { [defaultLanguage]: formData.nameML?.[defaultLanguage] || formData.name };
            const descriptionML = { [defaultLanguage]: formData.descriptionML?.[defaultLanguage] || formData.description || '' };

            // Add other language values
            availableLanguages.forEach(lang => {
                if (lang !== defaultLanguage) {
                    nameML[lang] = formData.nameML?.[lang] || formData.name;
                    descriptionML[lang] = formData.descriptionML?.[lang] || formData.description || '';
                }
            });

            const processedData = {
                ...formData,
                nameML,
                descriptionML
            };

            let response;
            if (editCollection) {
                response = await updateCollection(editCollection.id, processedData);
                if (response.success) {
                    toast.success('Collection updated successfully');
                } else {
                    toast.error(response.error || 'Failed to update collection');
                }
            } else {
                response = await createCollection(processedData);
                if (response.success) {
                    toast.success('Collection created successfully');
                } else {
                    toast.error(response.error || 'Failed to create collection');
                }
            }
            
            if (response.success) {
                setIsOpen(false);
                setEditCollection(null);
                setFormData(initialFormData);
                fetchData();
            }
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Operation failed');
            }
        }
    };

    const handleEdit = (collection) => {
        setEditCollection(collection);
        
        // Prepare multi-language data with fallback
        const nameML = collection.nameML || { [defaultLanguage]: collection.name || '' };
        const descriptionML = collection.descriptionML || { [defaultLanguage]: collection.description || '' };
        
        setFormData({
            name: nameML[defaultLanguage] || collection.name || '',
            slug: collection.slug,
            description: descriptionML[defaultLanguage] || collection.description || '',
            imageUrl: collection.imageUrl || '',
            isActive: collection.isActive,
            products: collection.products || [],
            nameML,
            descriptionML
        });
        setIsOpen(true);
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Prevent multiple uploads
        if (isUploading) {
            toast.error('Please wait for the current upload to finish');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
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

            const uploadFormData = new FormData();
            uploadFormData.append('files', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            });

            const data = await response.json();

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (data.success && data.data?.[0]) {
                setFormData({ ...formData, imageUrl: data.data[0].publicUrl });
                toast.success('Image uploaded successfully');

                // Reset the input value to allow re-uploading the same file
                event.target.value = '';
            } else {
                toast.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 800);
        }
    };

    const removeImage = () => {
        setFormData({ ...formData, imageUrl: '' });
    };

    const handleDeleteClick = (collection) => {
        setCollectionToDelete(collection);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!collectionToDelete) return;

        setIsDeleting(true);
        try {
            const response = await deleteCollection(collectionToDelete.id);
            if (response.success) {
                toast.success('Collection deleted successfully');
                setDeleteDialogOpen(false);
                setCollectionToDelete(null);
                fetchData();
            } else {
                toast.error(response.error || 'Failed to delete collection');
            }
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to delete collection');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setCollectionToDelete(null);
        setIsDeleting(false);
    };

    return (
        <div className="space-y-4">
            <AdminHeader title="Collections" description="Manage your product collections" />
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Collection
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editCollection ? 'Edit Collection' : 'Add New Collection'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Language Selector */}
                            {availableLanguages.length > 1 && (
                                <div className="flex justify-center">
                                    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                                        {availableLanguages.map((lang, index) => (
                                            <button
                                                key={`lang-${lang}-${index}`}
                                                type="button"
                                                onClick={() => setCurrentLanguage(lang)}
                                                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                                                    currentLanguage === lang
                                                        ? 'bg-background text-foreground shadow-sm'
                                                        : ''
                                                }`}
                                            >
                                                {lang.toUpperCase()}
                                                {lang === defaultLanguage && (
                                                    <span className="ml-1 text-xs text-muted-foreground">(default)</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Name * {availableLanguages.length > 1 && `(${currentLanguage.toUpperCase()})`}
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="Collection Name"
                                        value={getMultiLanguageValue('name', currentLanguage)}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            updateMultiLanguageField('name', currentLanguage, name);
                                            
                                            // Update slug only for default language
                                            if (currentLanguage === defaultLanguage) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    slug: generateSlug(name)
                                                }));
                                            }
                                        }}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug *</Label>
                                    <Input
                                        id="slug"
                                        placeholder="collection-slug"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    Description * {availableLanguages.length > 1 && `(${currentLanguage.toUpperCase()})`}
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Collection description..."
                                    value={getMultiLanguageValue('description', currentLanguage)}
                                    onChange={(e) => {
                                        const description = e.target.value;
                                        updateMultiLanguageField('description', currentLanguage, description);
                                    }}
                                    className="min-h-[100px]"
                                    required
                                />
                            </div>

                            {/* Image Upload Section */}
                            <div className="space-y-2">
                                <Label>Cover Image</Label>
                                {formData.imageUrl ? (
                                    <div className="space-y-2">
                                        <div className="relative h-32 w-full overflow-hidden rounded-lg border">
                                            <img
                                                src={formData.imageUrl}
                                                alt="Collection cover"
                                                className="h-full w-full object-cover"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 h-8 w-8 p-0">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className={`rounded-lg border-2 border-dashed p-6 transition-colors ${
                                            isUploading
                                                ? 'pointer-events-none border-primary bg-primary/10'
                                                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                                        }`}>
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <p className="font-medium text-primary text-sm">
                                                        Uploading image...
                                                    </p>
                                                    <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                                                            style={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-muted-foreground text-xs">
                                                        {Math.round(uploadProgress)}%
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                                    <div className="text-center">
                                                        <Label
                                                            htmlFor="image-upload"
                                                            className="cursor-pointer font-medium text-sm">
                                                            Click to upload image
                                                        </Label>
                                                        <p className="mt-1 text-muted-foreground text-xs">
                                                            PNG, JPG, WEBP up to 10MB
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                            <Input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={isUploading}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Items in Collection</Label>
                                <ScrollArea className="max-h-[200px] rounded-md border p-4">
                                    <div className="space-y-3">
                                        {products.map((item, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`item-${item.id}`}
                                                    checked={formData.products.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        const newItems = checked
                                                            ? [...formData.products, item.id]
                                                            : formData.products.filter((id) => id !== item.id);
                                                        setFormData({ ...formData, products: newItems });
                                                    }}
                                                />
                                                <Label htmlFor={`item-${item.id}`} className="font-normal text-sm">
                                                    {item.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                />
                                <Label htmlFor="isActive">Active Collection</Label>
                            </div>

                            <Button type="submit" className="w-full">
                                {editCollection ? 'Update Collection' : 'Create Collection'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

            {/* Search Input */}
            <div className="flex items-center justify-between">
                <Input
                    type="text"
                    placeholder="Search collections..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1); // Reset to first page when searching
                    }}
                    className="max-w-md"
                />
                {totalItems > 0 && (
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} collections
                    </p>
                )}
            </div>

            {loading ? (
                <TableSkeleton columns={5} rows={5} />
            ) : (
                <ScrollArea className="h-[calc(100vh-250px)]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {collections.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        No collections found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                collections.map((collection, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {collection.imageUrl ? (
                                                    <img
                                                        src={collection.imageUrl}
                                                        alt={collection.name}
                                                        className="h-10 w-10 rounded object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                                                        <ImageIcon className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium">
                                                        {collection.nameML?.[defaultLanguage] || collection.name}
                                                    </div>
                                                    <div className="text-muted-foreground text-sm">
                                                        {(() => {
                                                            const description = collection.descriptionML?.[defaultLanguage] || collection.description || '';
                                                            return description.length > 50
                                                                ? `${description.substring(0, 50)}...`
                                                                : description;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{collection.products.length} items</TableCell>
                                        <TableCell>
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs ${
                                                    collection.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {collection.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(collection.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="space-x-2 text-right">
                                            {/* Mobile view - show individual buttons */}
                                            <div className="flex space-x-2 sm:hidden">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleEdit(collection)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(collection)}
                                                    disabled={isDeleting && collectionToDelete?.id === collection.id}>
                                                    {isDeleting && collectionToDelete?.id === collection.id ? (
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
                                                                isDeleting && collectionToDelete?.id === collection.id
                                                            }>
                                                            {isDeleting && collectionToDelete?.id === collection.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuItem onClick={() => handleEdit(collection)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit Collection
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(collection)}
                                                            className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Collection
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
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious 
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage > 1) {
                                            setCurrentPage(currentPage - 1);
                                        }
                                    }}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage(page);
                                        }}
                                        isActive={currentPage === page}
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext 
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage < totalPages) {
                                            setCurrentPage(currentPage + 1);
                                        }
                                    }}
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{collectionToDelete?.name}"? This action cannot be undone
                            and will remove this collection from all associated products.
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
                                'Delete Collection'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
