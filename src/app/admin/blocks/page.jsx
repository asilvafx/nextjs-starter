"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Plus, Eye, Edit, Trash2, Code, Type, FileText, Layout, Copy } from "lucide-react";
import { getAll, create, update, remove } from "@/lib/client/query.js";

import RichTextEditor from '@/components/ui/rich-text-editor';

const blockTypes = [
  { value: 'html', label: 'HTML Code', icon: Code },
  { value: 'text', label: 'Rich Text', icon: Type },
  { value: 'form', label: 'Form Block', icon: FileText },
  { value: 'layout', label: 'Layout Block', icon: Layout },
];

const initialFormData = {
  name: "",
  slug: "",
  type: "text",
  content: "",
  description: "",
  isActive: true,
  tags: [],
  customCSS: "",
  customJS: "",
};

export default function BlocksPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const itemsPerPage = 10;

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const response = await getAll("blocks");
      
      if (response.success && Array.isArray(response.data)) { 
        setBlocks(response.data);
      } else {
        // Fallback to empty array if response doesn't contain valid data
        setBlocks([]);
        if (response.error) {
          toast.error(response.error);
        }
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]); // Ensure blocks is always an array
      toast.error("Failed to fetch blocks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getFilteredAndSortedBlocks = useCallback(() => {
    // Ensure blocks is always an array
    if (!Array.isArray(blocks)) {
      return [];
    }
    
    let filtered = [...blocks];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (block) => {
          return block.name?.toLowerCase().includes(searchLower) ||
                 block.slug?.toLowerCase().includes(searchLower) ||
                 block.description?.toLowerCase().includes(searchLower) ||
                 block.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        }
      );
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(block => block.type === filterType);
    }

    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [blocks, search, filterType, sortConfig]);

  const getPaginatedBlocks = () => {
    const filtered = getFilteredAndSortedBlocks();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(getFilteredAndSortedBlocks().length / itemsPerPage);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      setFormData(prev => ({ 
        ...prev, 
        slug: generateSlug(value)
      }));
    }
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const blockData = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const response = await create(blockData, "blocks");
      
      if (response.success) {
        toast.success("Block created successfully");
        setBlocks(prev => [...prev, response.data]);
        setIsOpen(false);
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error("Failed to create block");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (block) => {
    setSelectedBlock(block);
    setFormData({
      ...block,
      tags: block.tags || [],
      customCSS: block.customCSS || "",
      customJS: block.customJS || "",
    });
    setEditMode(true);
    setIsEditOpen(true);
  };

  const handleView = (block) => {
    setSelectedBlock(block);
    setIsViewOpen(true);
  };

  const handleDelete = (block) => {
    setSelectedBlock(block);
    setDeleteConfirmText("");
    setIsDeleteOpen(true);
  };

  const handleCopySlug = (slug) => {
    navigator.clipboard.writeText(slug);
    toast.success("Slug copied to clipboard!");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedData = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      
      const response = await update(selectedBlock.id, updatedData, "blocks");
      if (response.success) {
        toast.success('Block updated successfully!');
        setFormData(initialFormData);
        setIsEditOpen(false);
        setEditMode(false);
        setSelectedBlock(null);
        await fetchBlocks();
      } else {
        toast.error(response.error || 'Failed to update block');
      }
    } catch (error) {
      console.error('Error updating block:', error);
      toast.error('Error updating block');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText !== 'delete') {
      toast.error('Please type "delete" to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await remove(selectedBlock.id, "blocks");
      if (response.success) {
        toast.success('Block deleted successfully!');
        setIsDeleteOpen(false);
        setSelectedBlock(null);
        setDeleteConfirmText("");
        await fetchBlocks();
      } else {
        toast.error(response.error || 'Failed to delete block');
      }
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Error deleting block');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialogs = () => {
    setIsOpen(false);
    setIsEditOpen(false);
    setIsViewOpen(false);
    setIsDeleteOpen(false);
    setFormData(initialFormData);
    setSelectedBlock(null);
    setEditMode(false);
    setDeleteConfirmText("");
    setTagInput("");
  };

  const getBlockTypeIcon = (type) => {
    const blockType = blockTypes.find(bt => bt.value === type);
    return blockType ? blockType.icon : FileText;
  };

  const getBlockTypeLabel = (type) => {
    const blockType = blockTypes.find(bt => bt.value === type);
    return blockType ? blockType.label : type;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Content Blocks</h2>
            <p className="text-muted-foreground">Create and manage reusable content blocks</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-4 items-center">
              <Input
                placeholder="Search blocks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {blockTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Block
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Block</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Block Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                          id="slug"
                          name="slug"
                          value={formData.slug}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type">Block Type</Label>
                        <Select name="type" value={formData.type} onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, type: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {blockTypes.map(type => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="isActive">Status</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({ ...prev, isActive: checked }))
                            }
                          />
                          <Label htmlFor="isActive">Active</Label>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Brief description of this block"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="content">Content</Label>
                      {formData.type === 'html' ? (
                        <Textarea
                          id="content"
                          name="content"
                          value={formData.content}
                          onChange={handleInputChange}
                          rows={8}
                          placeholder="Enter HTML code..."
                          className="font-mono"
                        />
                      ) : (
                        <RichTextEditor
                          value={formData.content}
                          onChange={handleContentChange}
                          placeholder="Enter your content..."
                        />
                      )}
                    </div>

                    {/* Tags */}
                    <div className="grid gap-2">
                      <Label>Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add a tag..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <Button type="button" onClick={handleAddTag} size="sm">
                          Add
                        </Button>
                      </div>
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="cursor-pointer" 
                              onClick={() => handleRemoveTag(tag)}>
                              {tag} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Advanced Options */}
                    <div className="grid gap-4 pt-4 border-t">
                      <div className="grid gap-2">
                        <Label htmlFor="customCSS">Custom CSS</Label>
                        <Textarea
                          id="customCSS"
                          name="customCSS"
                          value={formData.customCSS}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="/* Custom CSS for this block */"
                          className="font-mono"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="customJS">Custom JavaScript</Label>
                        <Textarea
                          id="customJS"
                          name="customJS"
                          value={formData.customJS}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="// Custom JavaScript for this block"
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Block"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[calc(100vh-300px)]">
            {loading ? (
              <TableSkeleton columns={6} rows={5} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                      Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead onClick={() => handleSort("updatedAt")} className="cursor-pointer">
                      Updated {sortConfig.key === "updatedAt" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedBlocks().map((block) => {
                    const Icon = getBlockTypeIcon(block.type);
                    
                    return (
                      <TableRow key={block.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{block.name}</div>
                            {block.description && (
                              <div className="text-sm text-muted-foreground">{block.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {getBlockTypeLabel(block.type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {block.slug}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopySlug(block.slug)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={block.isActive ? "default" : "secondary"}>
                            {block.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {block.updatedAt ? formatDate(block.updatedAt) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleView(block)}
                              title="View Block"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(block)}
                              title="Edit Block"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(block)}
                              title="Delete Block"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea> 
          
          {!loading && totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )} 
        </div>
      </div>

      {/* Edit Block Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Block Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Block Type</Label>
                  <Select name="type" value={formData.type} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {blockTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="isActive">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isActive: checked }))
                      }
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this block"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                {formData.type === 'html' ? (
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={8}
                    placeholder="Enter HTML code..."
                    className="font-mono"
                  />
                ) : (
                  <RichTextEditor
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="Enter your content..."
                  />
                )}
              </div>

              {/* Tags */}
              <div className="grid gap-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} size="sm">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              <div className="grid gap-4 pt-4 border-t">
                <div className="grid gap-2">
                  <Label htmlFor="customCSS">Custom CSS</Label>
                  <Textarea
                    id="customCSS"
                    name="customCSS"
                    value={formData.customCSS}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="/* Custom CSS for this block */"
                    className="font-mono"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customJS">Custom JavaScript</Label>
                  <Textarea
                    id="customJS"
                    name="customJS"
                    value={formData.customJS}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="// Custom JavaScript for this block"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialogs}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Block"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Block Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Block Details</DialogTitle>
          </DialogHeader>
          {selectedBlock && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedBlock.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Slug</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {selectedBlock.slug}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySlug(selectedBlock.slug)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const Icon = getBlockTypeIcon(selectedBlock.type);
                      return <Icon className="w-4 h-4" />;
                    })()}
                    <span className="text-sm text-muted-foreground">
                      {getBlockTypeLabel(selectedBlock.type)}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedBlock.isActive ? "default" : "secondary"}>
                      {selectedBlock.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedBlock.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedBlock.description}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Content Preview</Label>
                <div className="mt-2 p-4 border rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                  {selectedBlock.type === 'html' ? (
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {selectedBlock.content}
                    </pre>
                  ) : (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedBlock.content }}
                    />
                  )}
                </div>
              </div>

              {selectedBlock.tags && selectedBlock.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedBlock.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-muted-foreground mt-1">
                    {selectedBlock.createdAt ? formatDate(selectedBlock.createdAt) : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-muted-foreground mt-1">
                    {selectedBlock.updatedAt ? formatDate(selectedBlock.updatedAt) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={handleCloseDialogs}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Block Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Block</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this block? This action cannot be undone.
            </p>
            {selectedBlock && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="font-medium">{selectedBlock.name}</p>
                <p className="text-sm text-muted-foreground">
                  {getBlockTypeLabel(selectedBlock.type)} • {selectedBlock.slug}
                </p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="deleteConfirm">Type "delete" to confirm</Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialogs}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmText !== 'delete' || isDeleting}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete Block"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}