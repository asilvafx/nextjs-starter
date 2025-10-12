// @/app/admin/store/catalog/page.jsx

"use client";

import { useEffect, useState } from "react";
import { getAll, create, update, remove } from "@/lib/client/query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Image, ArrowUpDown, Loader2 } from "lucide-react";
import { useTableState } from "../hooks/useTableState";
import { TableSkeleton } from "@/components/ui/skeleton";
import { CatalogItemForm } from "./CatalogItemForm";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; 

const initialFormData = {
  type: "physical",
  name: "",
  sku: "",
  description: "",
  price: 0,
  compareAtPrice: 0,
  categoryId: "",
  collections: [],
  images: [],
  coverImageIndex: 0,
  weight: 0,
  stock: 0,
  lowStockAlert: 5,
  downloadLink: "",
  downloadNotes: "",
  duration: 60,
  serviceNotes: "",
  customAttributes: [],
  isActive: true,
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
    paginatedItems,
  } = useTableState();

  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [storeSettings, setStoreSettings] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catalogRes, categoriesRes, collectionsRes, storeRes] = await Promise.all([
        getAll("catalog"),
        getAll("categories"),
        getAll("collections"),
        fetch('/api/shop/settings').then(res => res.json())
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
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };  useEffect(() => {
    fetchData();
  }, []);

    const handleImageUpload = async (files) => {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          return {
            url: data.url,
            alt: file.name,
          };
        })
      );
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
    };
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const processedData = {
          ...formData,
        };

      if (editItem) {
        const response = await update(editItem.id, processedData, "catalog");
        if (response.success) {
          toast.success("Item updated successfully");
          setCatalog((prev) =>
            prev.map((item) =>
              item.id === editItem.id ? { ...item, ...processedData } : item
            )
          );
        }
      } else {
        const response = await create(processedData, "catalog");
        if (response.success) {
          toast.success("Item created successfully");
          setCatalog((prev) => [...prev, response.data]);
        }
      }
      setIsOpen(false);
      setFormData(initialFormData);
      setEditItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error("Failed to save item");
    }
  };

  const handleEdit = (product) => {
    setEditItem(product);
    setFormData({
      ...initialFormData,
      ...product,
      // Ensure all fields are properly set
      collections: product.collections || [],
      images: product.images || [],
      customAttributes: product.customAttributes || [],
      categoryId: product.categoryId || "",
      // Ensure numeric fields are properly handled
      price: product.price || 0,
      compareAtPrice: product.compareAtPrice || 0,
      weight: product.weight || 0,
      stock: product.stock || 0,
      lowStockAlert: product.lowStockAlert || 5,
      duration: product.duration || 60,
      coverImageIndex: product.coverImageIndex || 0,
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
      await remove(itemToDelete.id, "catalog");
      toast.success("Item deleted successfully");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete item");
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
      style: "currency",
      currency: currency,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <TableSkeleton columns={5} rows={5} />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Items</h2>
              <p className="text-muted-foreground">Manage your catalog items</p>
            </div>
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setEditItem(null);
                setFormData(initialFormData);
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditItem(null);
                  setFormData(initialFormData);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-[90vw]">
                <DialogHeader>
                  <DialogTitle>
                    {editItem ? "Edit Item" : "Add New Item"}
                  </DialogTitle>
                </DialogHeader>
                <CatalogItemForm
                  formData={formData}
                  setFormData={setFormData}
                  editItem={editItem}
                  categories={categories}
                  collections={collections}
                  onSubmit={handleSubmit}
                  onImageUpload={handleImageUpload}
                />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
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
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('price')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Price
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('stock')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
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
                              src={item.images[item.coverImageIndex >= 0 ? item.coverImageIndex : 0]?.url || item.images[0]?.url}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <Image className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.description.length > 50
                                ? item.description.substring(0, 50) + "..."
                                : item.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatPrice(item.price)}</TableCell>
                        <TableCell>
                          {categories.find((c) => c.id === item.categoryId)?.name ||
                            "Uncategorized"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              item.stock > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.stock > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteClick(item)}
                            disabled={isDeleting && itemToDelete?.id === item.id}
                          >
                            {isDeleting && itemToDelete?.id === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
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
            
            {/* Items count info */}
            <div className="text-sm text-muted-foreground text-center">
              Showing {paginatedItems.length} of {filteredItems.length} items
              {search && ` (filtered from ${catalog.length} total)`}
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone and will permanently remove the item from your catalog.
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
                "Delete Item"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}