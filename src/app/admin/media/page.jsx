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
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react";

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
  const inputRef = useRef(null);
  const itemsPerPage = 10;

  const fetchMedia = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getAll("gallery", {
        page,
        limit: itemsPerPage,
        search: search || null,
      });
      
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
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      setUploading(true);
      const uploadResult = await upload(file); 
      const uploadUrl = uploadResult[0]?.publicUrl;

      if (uploadUrl) {
        const blobUrl = uploadUrl;
        const uploadData = {
          url: blobUrl,
          alt: file.name,
          featured: false,
        }
        await create(uploadData, "gallery");

        toast.success("Image uploaded successfully");
        setIsUploadDialogOpen(false);
        fetchMedia(currentPage);
      }
    } catch (error) {
      const errorMessage = error?.message || "Failed to upload image";
      toast.error(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        await remove(id, "gallery");
        toast.success("Image deleted successfully");
        fetchMedia(currentPage);
      } catch (error) {
        toast.error("Failed to delete image");
      }
    }
  };

  const toggleFeatured = async (id, featured) => {
    try {
      //await update(id, { featured: !featured }, "gallery");
      toast.success(featured ? "Image unfeatured" : "Image featured");
      fetchMedia(currentPage);
    } catch (error) {
      toast.error("Failed to update image");
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
        <Button disabled={loading} onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Images
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

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
            <DialogDescription>
              Drag and drop your images or click to browse
            </DialogDescription>
          </DialogHeader>
          <div
            className={`mt-4 grid place-items-center border-2 border-dashed rounded-lg p-8 transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop your images here or click to browse
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
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
                  >
                    <Star className="h-4 w-4" />
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
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
      </>
      ) }
    </div>
  );
}