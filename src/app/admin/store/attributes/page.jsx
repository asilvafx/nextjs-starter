// @/app/admin/store/attributes/page.jsx

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
import { Plus, Pencil, Trash2, ArrowUpDown, Loader2 } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialFormData = {
  name: "",
  slug: "",
  type: "text", // text, number, select, color, boolean
  description: "",
  options: [], // For select type
  isRequired: false,
  isActive: true,
};

const ATTRIBUTE_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select Options" },
  { value: "color", label: "Color" },
  { value: "boolean", label: "Yes/No" },
];

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
  const [newOption, setNewOption] = useState("");

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const response = await getAll("attributes");
      if (response.success) {
        setAttributes(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch attributes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const processedData = {
        ...formData,
        options: formData.type === 'select' ? formData.options : [],
      };

      if (editAttribute) {
        await update(editAttribute.id, processedData, "attributes");
        toast.success("Attribute updated successfully");
      } else {
        await create(processedData, "attributes");
        toast.success("Attribute created successfully");
      }
      setIsOpen(false);
      setEditAttribute(null);
      setFormData(initialFormData);
      fetchAttributes();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Operation failed");
      }
    }
  };

  const handleEdit = (attribute) => {
    setEditAttribute(attribute);
    setFormData({
      name: attribute.name || "",
      slug: attribute.slug || "",
      type: attribute.type || "text",
      description: attribute.description || "",
      options: attribute.options || [],
      isRequired: attribute.isRequired || false,
      isActive: attribute.isActive !== false,
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
      await remove(attributeToDelete.id, "attributes");
      toast.success("Attribute deleted successfully");
      setDeleteDialogOpen(false);
      setAttributeToDelete(null);
      fetchAttributes();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete attribute");
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
      setNewOption("");
    }
  };

  const removeOption = (optionToRemove) => {
    setFormData({
      ...formData,
      options: formData.options.filter(option => option !== optionToRemove)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Attributes</h2>
          <p className="text-muted-foreground">
            Manage custom attributes for your products and services
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditAttribute(null);
            setFormData(initialFormData);
            setNewOption("");
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditAttribute(null);
              setFormData(initialFormData);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Attribute
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editAttribute ? "Edit Attribute" : "Add New Attribute"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Color, Size, Material"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: generateSlug(name),
                      });
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
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select attribute type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTRIBUTE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this attribute..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
                          className="ml-2 hover:text-red-500"
                        >
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
                    onChange={(e) =>
                      setFormData({ ...formData, isRequired: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="isRequired">Required field</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editAttribute ? "Update Attribute" : "Create Attribute"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
                  attributes.map((attribute) => (
                    <TableRow key={attribute.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{attribute.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {attribute.description?.length > 50
                              ? attribute.description.substring(0, 50) + "..."
                              : attribute.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ATTRIBUTE_TYPES.find(t => t.value === attribute.type)?.label || attribute.type}
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
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant={attribute.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {attribute.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {attribute.isRequired && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(attribute.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(attribute)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClick(attribute)}
                          disabled={isDeleting && attributeToDelete?.id === attribute.id}
                        >
                          {isDeleting && attributeToDelete?.id === attribute.id ? (
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
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attribute</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{attributeToDelete?.name}"? This action cannot be undone and will remove this attribute from all products that use it.
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
                "Delete Attribute"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}