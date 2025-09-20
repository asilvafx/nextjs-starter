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
import { Plus, Pencil, Trash2, Image } from "lucide-react";
import { useTableState } from "./hooks/useTableState";
import { TableSkeleton } from "@/components/ui/skeleton";
import { CatalogItemForm } from "./CatalogItemForm"; 

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
  } = useTableState();

  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catalogRes, categoriesRes, collectionsRes] = await Promise.all([
        getAll("catalog"),
        getAll("categories"),
        getAll("collections"),
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
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      inStock: product.inStock,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await remove(id, "catalog");
        toast.success("Item deleted successfully");
        fetchData();
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Failed to delete product");
        }
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
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
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalog.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedItems().map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[item.coverImageIndex]?.url}
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
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}