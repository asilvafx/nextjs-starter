'use client';

import { CheckCircle, Copy, Image as ImageIcon, Loader2, Search, Star, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AdminHeader from '@/app/admin/components/AdminHeader';
import { 
    getAllGalleryMedia, 
    createGalleryMedia, 
    updateGalleryMedia, 
    deleteGalleryMedia 
} from '@/lib/server/admin.js';
import { upload } from '@/lib/client/query';
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
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading image component with animation
const LazyImage = ({ src, alt, className, onLoad }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);

    const handleImageLoad = () => {
        setImageLoaded(true);
        if (onLoad) onLoad();
    };

    const handleImageError = () => {
        setImageFailed(true);
        setImageLoaded(true);
    };

    return (
        <div className="relative w-full h-full overflow-hidden">
            {!imageLoaded && !imageFailed && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <div className="text-xs text-muted-foreground">Loading...</div>
                    </div>
                </div>
            )}
            
            {imageFailed ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                        <div className="text-xs">Failed to load</div>
                    </div>
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    loading="lazy"
                />
            )}
        </div>
    );
};

export default function GalleryPage() {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [_selectedFile, _setSelectedFile] = useState(null);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [updatingFeatured, setUpdatingFeatured] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const inputRef = useRef(null);
    const itemsPerPage = 10;

    const fetchMedia = async (page = 1) => {
        try {
            setLoading(true);
            const response = await getAllGalleryMedia({
                page,
                limit: itemsPerPage,
                search: search || ''
            });

            console.log('Fetch response:', response);

            // Handle response from admin function
            if (response?.success && response?.data) {
                setMedia(response.data);
                setTotalPages(response.pagination?.totalPages || 1);
            } else {
                // Set defaults if response is not successful
                setMedia([]);
                setTotalPages(1);
                if (response?.error) {
                    console.error('Fetch error:', response.error);
                }
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to fetch media');
            setMedia([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            setCurrentPage(1);
            fetchMedia(1);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [search]);

    useEffect(() => {
        fetchMedia(currentPage);
    }, [currentPage]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (uploading) return; // Don't handle drag when uploading

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files?.[0]) {
            await handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = async (e) => {
        e.preventDefault();
        if (e.target.files?.[0]) {
            await handleFileUpload(e.target.files[0]);
        }
    };

    const handleFileUpload = async (file) => {
        // Prevent multiple uploads
        if (uploading) {
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

        try {
            setUploading(true);
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
            
            const uploadResult = await upload(file);
            clearInterval(progressInterval);

            if (uploadResult && uploadResult.length > 0) {
                const uploadUrl = uploadResult[0]?.publicUrl || uploadResult[0]?.url;

                // Create the new image data and add to database
                const imageData = {
                    url: uploadUrl,
                    alt: file.name,
                    featured: false
                };

                const createResponse = await createGalleryMedia(imageData);

                if (createResponse.success) {
                    // Add the new image to the current media state with the actual ID from server
                    const newImage = {
                        id: createResponse.data?.id || createResponse.data?.key || Date.now(),
                        ...imageData
                    };

                    setMedia((prevMedia) => [newImage, ...prevMedia]);

                    // Complete the progress
                    setUploadProgress(100);

                    // Update total pages if we're adding to a full page
                    if (media.length >= itemsPerPage && currentPage === 1) {
                        // Only update if we're on the first page to avoid pagination issues
                        setTotalPages((prevPages) => prevPages);
                    }

                    toast.success(
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Image uploaded successfully!
                        </div>
                    );

                    // Small delay to show success state before closing
                    setTimeout(() => {
                        setIsUploadDialogOpen(false);
                        setUploadProgress(0);
                    }, 800);
                } else {
                    throw new Error(createResponse.error || 'Failed to save image to gallery');
                }
            } else {
                throw new Error('Upload failed - no file URL returned');
            }
        } catch (error) {
            const errorMessage = error?.message || 'Failed to upload image';
            toast.error(
                <div className="flex items-center gap-2">
                    <span className="text-destructive">✕</span>
                    {errorMessage}
                </div>
            );
            console.error('Upload error:', error);

            // Reset file input on error
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteGalleryMedia(itemToDelete.id);
            
            if (result.success) {
                // Remove the item from the current media state
                setMedia((prevMedia) => prevMedia.filter((item) => item.id !== itemToDelete.id));

                toast.success('Image deleted successfully');
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            } else {
                throw new Error(result.error || 'Failed to delete image');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.message || 'Failed to delete image');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        setIsDeleting(false);
    };

    const toggleFeatured = async (id, featured) => {
        setUpdatingFeatured(id);

        // Optimistically update the UI
        setMedia((prevMedia) => prevMedia.map((item) => (item.id === id ? { ...item, featured: !featured } : item)));

        try {
            const result = await updateGalleryMedia(id, { featured: !featured });
            
            if (result.success) {
                toast.success(featured ? 'Image unfeatured' : 'Image featured');
            } else {
                throw new Error(result.error || 'Failed to update image');
            }
        } catch (error) {
            console.error('Update error:', error);
            // Revert the optimistic update on error
            setMedia((prevMedia) => prevMedia.map((item) => (item.id === id ? { ...item, featured: featured } : item)));
            toast.error(error.message || 'Failed to update image');
        } finally {
            setUpdatingFeatured(null);
        }
    };

    const copyToClipboard = (url) => {
        navigator.clipboard.writeText(url);
        toast.success('URL copied to clipboard');
    };

    return (
        <div className="space-y-6 p-4">
            <AdminHeader title="Media Gallery" description="Manage your image gallery">
                <Button disabled={loading || uploading} onClick={() => setIsUploadDialogOpen(true)}>
                    {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload Images'}
                </Button>
            </AdminHeader>

            <div className="relative">
                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                <Input
                    disabled={loading}
                    placeholder="Search images..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                />
            </div>

            <Dialog
                open={isUploadDialogOpen}
                onOpenChange={(open) => {
                    // Prevent closing dialog while uploading
                    if (uploading && !open) {
                        return;
                    }
                    setIsUploadDialogOpen(open);
                }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Images</DialogTitle>
                        <DialogDescription>Drag and drop your images or click to browse</DialogDescription>
                    </DialogHeader>
                    <div
                        className={`mt-4 grid place-items-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                            uploading
                                ? 'pointer-events-none border-primary bg-primary/10'
                                : dragActive
                                  ? 'border-primary bg-primary/5'
                                  : 'cursor-pointer border-muted hover:border-primary/50 hover:bg-primary/5'
                        }`}
                        onDragEnter={!uploading ? handleDrag : undefined}
                        onDragLeave={!uploading ? handleDrag : undefined}
                        onDragOver={!uploading ? handleDrag : undefined}
                        onDrop={!uploading ? handleDrop : undefined}
                        onClick={!uploading ? () => inputRef.current?.click() : undefined}>
                        <div className="flex flex-col items-center gap-2">
                            {uploading ? (
                                <>
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="font-medium text-primary text-sm">Uploading image...</p>
                                    <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-muted-foreground text-xs">{Math.round(uploadProgress)}%</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground text-sm">
                                        Drop your images here or click to browse
                                    </p>
                                    <p className="text-muted-foreground/70 text-xs">PNG, JPG, WEBP up to 10MB</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            disabled={uploading}
                            className="hidden"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[200px] w-full" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-8 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : media.length === 0 ? (
                <div className="py-8 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 font-semibold text-sm">No images</h3>
                    <p className="mt-1 text-muted-foreground text-sm">Upload images to get started</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {media.map((item) => (
                            <Card key={item.id} className="group">
                                <CardHeader className="relative">
                                    <Button
                                        role="button"
                                        variant="ghost"
                                        size="icon"
                                        className={`absolute top-2 right-2 ${
                                            item.featured ? 'text-yellow-500' : 'text-muted-foreground'
                                        }`}
                                        onClick={() => toggleFeatured(item.id, item.featured)}
                                        disabled={updatingFeatured === item.id}>
                                        {updatingFeatured === item.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Star className="h-4 w-4" />
                                        )}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                                        <LazyImage
                                            src={item.url}
                                            alt={item.alt}
                                            className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(item.url)}
                                        className="w-full flex-1 sm:w-auto">
                                        <Copy className="mr-2 h-4 w-4" />
                                        <span className="truncate">Copy URL</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteClick(item)}
                                        disabled={isDeleting && itemToDelete?.id === item.id}
                                        className="w-full flex-1 sm:w-auto">
                                        {isDeleting && itemToDelete?.id === item.id ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="mr-2 h-4 w-4" />
                                        )}
                                        <span className="truncate">Delete</span>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            className={
                                                currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
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
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Image</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this image? This action cannot be undone and will
                            permanently remove the image from your gallery.
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
                                'Delete Image'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
