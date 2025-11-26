// @/app/admin/store/attributes/page.jsx

'use client';

import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
    getAllAttributes, 
    createAttribute, 
    updateAttribute, 
    deleteAttribute,
    getSiteSettings 
} from '@/lib/server/admin';

const initialFormData = {
    name: '',
    nameML: {}, // Multi-language names: { en: 'Name', fr: 'Nom' }
    slug: '',
    type: 'text', // text, number, select, color, boolean
    description: '',
    descriptionML: {}, // Multi-language descriptions
    options: [], // For select type
    isRequired: false,
    isActive: true
};

const ATTRIBUTE_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select Options' },
    { value: 'color', label: 'Color' },
    { value: 'boolean', label: 'Yes/No' }
];

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

export default function AttributesPage() {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editAttribute, setEditAttribute] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [attributeToDelete, setAttributeToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [newOption, setNewOption] = useState('');
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
            const [attributesRes, settingsRes] = await Promise.all([
                getAllAttributes({
                    page: currentPage,
                    limit: itemsPerPage,
                    search: search
                }),
                getSiteSettings()
            ]);
            
            if (attributesRes.success) {
                setAttributes(attributesRes.data);
                setTotalPages(attributesRes.pagination.totalPages);
                setTotalItems(attributesRes.pagination.totalItems);
            }
            
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
                descriptionML,
                options: formData.type === 'select' ? formData.options : [],
                type: formData.type || 'text'
            };

            let response;
            if (editAttribute) {
                response = await updateAttribute(editAttribute.id, processedData);
                if (response.success) {
                    toast.success('Attribute updated successfully');
                } else {
                    toast.error(response.error || 'Failed to update attribute');
                }
            } else {
                response = await createAttribute(processedData);
                if (response.success) {
                    toast.success('Attribute created successfully');
                } else {
                    toast.error(response.error || 'Failed to create attribute');
                }
            }
            
            if (response.success) {
                setIsOpen(false);
                setEditAttribute(null);
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

    const handleEdit = (attribute) => {
        setEditAttribute(attribute);
        
        // Prepare multi-language data with fallback
        const nameML = attribute.nameML || { [defaultLanguage]: attribute.name || '' };
        const descriptionML = attribute.descriptionML || { [defaultLanguage]: attribute.description || '' };
        
        setFormData({
            name: nameML[defaultLanguage] || attribute.name || '',
            slug: attribute.slug || '',
            type: attribute.type || 'text',
            description: descriptionML[defaultLanguage] || attribute.description || '',
            options: attribute.options || [],
            nameML,
            descriptionML
        });
        setIsOpen(true);
    };

    const handleDeleteClick = (attribute) => {
        setAttributeToDelete(attribute);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!attributeToDelete) return;

        setIsDeleting(true);
        try {
            const response = await deleteAttribute(attributeToDelete.id);
            if (response.success) {
                toast.success('Attribute deleted successfully');
                setDeleteDialogOpen(false);
                setAttributeToDelete(null);
                fetchData();
            } else {
                toast.error(response.error || 'Failed to delete attribute');
            }
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to delete attribute');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setAttributeToDelete(null);
        setIsDeleting(false);
    };

    const addOption = () => {
        if (newOption.trim() && !formData.options.includes(newOption.trim())) {
            setFormData({
                ...formData,
                options: [...formData.options, newOption.trim()]
            });
            setNewOption('');
        }
    };

    const removeOption = (optionToRemove) => {
        setFormData({
            ...formData,
            options: formData.options.filter((option) => option !== optionToRemove)
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-2xl">Attributes</h2>
                    <p className="text-muted-foreground">Manage custom attributes for your products and services</p>
                </div>
                <Dialog
                    open={isOpen}
                    onOpenChange={(open) => {
                        setIsOpen(open);
                        if (!open) {
                            setEditAttribute(null);
                            setFormData(initialFormData);
                            setNewOption('');
                        }
                    }}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                setEditAttribute(null);
                                setFormData(initialFormData);
                            }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Attribute
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editAttribute ? 'Edit Attribute' : 'Add New Attribute'}</DialogTitle>
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
                                        placeholder="e.g., Color, Size, Material"
                                        value={getMultiLanguageValue(formData.nameML, currentLanguage, defaultLanguage, formData.name)}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            const updatedFormData = updateMultiLanguageField(
                                                formData,
                                                'nameML',
                                                currentLanguage,
                                                name
                                            );
                                            
                                            // Update slug only for default language
                                            if (currentLanguage === defaultLanguage) {
                                                updatedFormData.name = name;
                                                updatedFormData.slug = generateSlug(name);
                                            }
                                            
                                            setFormData(updatedFormData);
                                        }}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug *</Label>
                                    <Input
                                        id="slug"
                                        placeholder="color-size-material"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select attribute type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ATTRIBUTE_TYPES.map((type, index) => (
                                            <SelectItem key={index} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    Description {availableLanguages.length > 1 && `(${currentLanguage.toUpperCase()})`}
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe this attribute..."
                                    value={getMultiLanguageValue(formData.descriptionML, currentLanguage, defaultLanguage, formData.description)}
                                    onChange={(e) => {
                                        const description = e.target.value;
                                        const updatedFormData = updateMultiLanguageField(
                                            formData,
                                            'descriptionML',
                                            currentLanguage,
                                            description
                                        );
                                        
                                        // Update base description for default language
                                        if (currentLanguage === defaultLanguage) {
                                            updatedFormData.description = description;
                                        }
                                        
                                        setFormData(updatedFormData);
                                    }}
                                    className="min-h-[80px]"
                                />
                            </div>

                            {formData.type === 'select' && (
                                <div className="space-y-4">
                                    <Label>Options</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add option..."
                                            value={newOption}
                                            onChange={(e) => setNewOption(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addOption();
                                                }
                                            }}
                                        />
                                        <Button type="button" onClick={addOption} variant="outline">
                                            Add
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.options.map((option, index) => (
                                            <Badge key={index} variant="secondary" className="cursor-pointer">
                                                {option}
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(option)}
                                                    className="ml-2 hover:text-red-500">
                                                    ×
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="isRequired"
                                        checked={formData.isRequired}
                                        onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Label htmlFor="isRequired">Required field</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Label htmlFor="isActive">Active</Label>
                                </div>
                            </div>

                            <Button type="submit" className="w-full">
                                {editAttribute ? 'Update Attribute' : 'Create Attribute'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search Input */}
            <div className="flex items-center justify-between">
                <Input
                    type="text"
                    placeholder="Search attributes..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1); // Reset to first page when searching
                    }}
                    className="max-w-md"
                />
                {totalItems > 0 && (
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} attributes
                    </p>
                )}
            </div>

            {loading ? (
                <TableSkeleton columns={5} rows={5} />
            ) : (
                <div className="space-y-4">
                    <ScrollArea className="h-[calc(100vh-250px)]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Options</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attributes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">
                                            No attributes found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attributes.map((attribute, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {attribute.nameML?.[defaultLanguage] || attribute.name}
                                                    </div>
                                                    <div className="text-muted-foreground text-sm">
                                                        {(() => {
                                                            const description = attribute.descriptionML?.[defaultLanguage] || attribute.description || '';
                                                            return description.length > 50
                                                                ? `${description.substring(0, 50)}...`
                                                                : description;
                                                        })()}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {ATTRIBUTE_TYPES.find((t) => t.value === attribute.type)?.label ||
                                                        attribute.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {attribute.type === 'select' && attribute.options?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {attribute.options.slice(0, 3).map((option, index) => (
                                                            <Badge key={index} variant="secondary" className="text-xs">
                                                                {option}
                                                            </Badge>
                                                        ))}
                                                        {attribute.options.length > 3 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{attribute.options.length - 3}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge
                                                        variant={attribute.isActive ? 'default' : 'secondary'}
                                                        className="text-xs">
                                                        {attribute.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    {attribute.isRequired && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Required
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{new Date(attribute.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="space-x-2 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleEdit(attribute)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(attribute)}
                                                    disabled={isDeleting && attributeToDelete?.id === attribute.id}>
                                                    {isDeleting && attributeToDelete?.id === attribute.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Attribute</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{attributeToDelete?.name}"? This action cannot be undone
                            and will remove this attribute from all products that use it.
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
                                'Delete Attribute'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
