"use client";

import { useEffect, useState, useRef } from "react";
import { getAll, create, update, remove, upload } from "@/lib/client/query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  CheckCircle,
  Search,
  Filter,
  Star,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function GalleryPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
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
      const response = await getAll("gallery", {
        page,
        limit: itemsPerPage,
        search: search || '',
      });

      console.log('Fetch response:', response);
      
      // Handle different response structures and ensure default values
      if (response?.success && response?.data && response?.data.length > 0) {
        // If response has data
        setMedia(response.data);
        setTotalPages(Math.ceil(response?.pagination?.totalItems / itemsPerPage));
        
      } else {
        // Set defaults if response is not successful
        setMedia([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error("Failed to fetch media");
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
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    // Prevent multiple uploads
    if (uploading) {
      toast.error("Please wait for the current upload to finish");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 200);
      const uploadResult = await upload(file); 
      const uploadUrl = uploadResult[0]?.publicUrl;

      if (uploadUrl) {
        const blobUrl = uploadUrl;
        
        // Create the new image data and add to database
        const imageData = {
          url: blobUrl,
          alt: file.name,
          featured: false,
        };
        
        const createResponse = await create(imageData, "gallery");
        
        // Add the new image to the current media state with the actual ID from server
        const newImage = {
          id: createResponse.data?.id || Date.now(),
          ...imageData,
        };
        
        setMedia(prevMedia => [newImage, ...prevMedia]);
        
        // Complete the progress
        setUploadProgress(100);
        
        // Update total pages if we're adding to a full page
        if (media.length >= itemsPerPage && currentPage === 1) {
          // Only update if we're on the first page to avoid pagination issues
          setTotalPages(prevPages => prevPages);
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
      }
    } catch (error) {
      const errorMessage = error?.message || "Failed to upload image";
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
      await remove(itemToDelete.id, "gallery");
      
      // Remove the item from the current media state
      setMedia(prevMedia => prevMedia.filter(item => item.id !== itemToDelete.id));
      
      toast.success("Image deleted successfully");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      toast.error("Failed to delete image");
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
    setMedia(prevMedia => 
      prevMedia.map(item => 
        item.id === id 
          ? { ...item, featured: !featured }
          : item
      )
    );
    
    try {
      await update(id, { featured: !featured }, "gallery");
      toast.success(featured ? "Image unfeatured" : "Image featured");
    } catch (error) {
      // Revert the optimistic update on error
      setMedia(prevMedia => 
        prevMedia.map(item => 
          item.id === id 
            ? { ...item, featured: featured }
            : item
        )
      );
      toast.error("Failed to update image");
    } finally {
      setUpdatingFeatured(null);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  }; 

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Media Gallery</h1>
          <p className="text-muted-foreground">
            Manage your image gallery
          </p>
        </div>
        <Button 
          disabled={loading || uploading} 
          onClick={() => setIsUploadDialogOpen(true)}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {uploading ? "Uploading..." : "Upload Images"}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
            <DialogDescription>
              Drag and drop your images or click to browse
            </DialogDescription>
          </DialogHeader>
          <div
            className={`mt-4 grid place-items-center border-2 border-dashed rounded-lg p-8 transition-colors ${
              uploading 
                ? "border-primary bg-primary/10 pointer-events-none"
                : dragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted cursor-pointer hover:border-primary/50 hover:bg-primary/5"
            }`}
            onDragEnter={!uploading ? handleDrag : undefined}
            onDragLeave={!uploading ? handleDrag : undefined}
            onDragOver={!uploading ? handleDrag : undefined}
            onDrop={!uploading ? handleDrop : undefined}
            onClick={!uploading ? () => inputRef.current?.click() : undefined}
          >
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-primary font-medium">
                    Uploading image...
                  </p>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(uploadProgress)}%
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drop your images here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    PNG, JPG, WEBP up to 10MB
                  </p>
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
         <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
      ) : (
      <>
          {media.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No images</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload images to get started
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => (
              <Card key={item.id} className="group">
                <CardHeader className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute right-2 top-2 ${
                      item.featured ? "text-yellow-500" : "text-muted-foreground"
                    }`}
                    onClick={() => toggleFeatured(item.id, item.featured)}
                    disabled={updatingFeatured === item.id}
                  >
                    {updatingFeatured === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.alt}
                      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(item.url)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(item)}
                    disabled={isDeleting && itemToDelete?.id === item.id}
                  >
                    {isDeleting && itemToDelete?.id === item.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={page === currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
      </>
      ) }
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone and will permanently remove the image from your gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Image"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}