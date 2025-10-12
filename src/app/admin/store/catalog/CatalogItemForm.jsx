"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getAll } from "@/lib/client/query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, X, Star, Image as ImageIcon } from "lucide-react"; 

const ITEM_TYPES = [
  { value: "physical", label: "Physical Product" },
  { value: "digital", label: "Digital Product" },
  { value: "service", label: "Service" },
];

export function CatalogItemForm({
  formData,
  setFormData,
  categories,
  collections,
  onSubmit,
  onImageUpload,
  editItem,
}) {
  const [customAttributes, setCustomAttributes] = useState(
    formData.customAttributes || [{ name: "", value: "" }]
  );
  const [isUploading, setIsUploading] = useState(false);
  const [availableAttributes, setAvailableAttributes] = useState([]);
  const [unlimitedStock, setUnlimitedStock] = useState(formData.stock === -1);

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const response = await getAll("attributes");
        if (response.success) {
          setAvailableAttributes(response.data.filter(attr => attr.isActive));
        }
      } catch (error) {
        console.error('Failed to fetch attributes:', error);
      }
    };
    fetchAttributes();
  }, []);

  const addAttribute = () => {
    setCustomAttributes([...customAttributes, { name: "", value: "" }]);
  };

  const removeAttribute = (index) => {
    const newAttributes = customAttributes.filter((_, i) => i !== index);
    setCustomAttributes(newAttributes);
  };

  const updateAttribute = (index, field, value) => {
    const newAttributes = [...customAttributes];
    newAttributes[index][field] = value;
    setCustomAttributes(newAttributes);
    setFormData({
      ...formData,
      customAttributes: newAttributes.filter((attr) => attr.name && attr.value),
    });
  };

  const handleImageUploadLocal = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      if (onImageUpload) {
        await onImageUpload(files);
        toast.success(`Uploaded ${files.length} image(s) successfully`);
      }
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverImageChange = (index) => {
    setFormData({ ...formData, coverImageIndex: index });
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newCoverIndex = formData.coverImageIndex >= newImages.length ? 0 : formData.coverImageIndex;
    setFormData({ 
      ...formData, 
      images: newImages,
      coverImageIndex: newCoverIndex
    });
  };

  const handleCollectionChange = (collectionId) => {
    const currentCollections = formData.collections || [];
    const isSelected = currentCollections.includes(collectionId);
    
    const newCollections = isSelected
      ? currentCollections.filter(id => id !== collectionId)
      : [...currentCollections, collectionId];
    
    setFormData({ ...formData, collections: newCollections });
  };

  return (
    <ScrollArea className="h-[80vh]">
      <form onSubmit={onSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Item Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      placeholder="Enter SKU"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="comparePrice">Compare at Price</Label>
                    <Input
                      id="comparePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.compareAtPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          compareAtPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter item description"
                    className="h-24"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.categoryId || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, categoryId: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {categories
                          .filter(category => category.id && category.name)
                          .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Collections</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex flex-wrap gap-2">
                        {(formData.collections || []).map((collectionId) => {
                          const collection = collections.find(c => c.id === collectionId);
                          return collection ? (
                            <Badge key={collectionId} variant="secondary" className="gap-1">
                              {collection.name}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCollectionChange(collectionId)}
                                className="h-auto p-0 hover:bg-transparent"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                      <Select onValueChange={handleCollectionChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Add to collections" />
                        </SelectTrigger>
                        <SelectContent>
                          {collections
                            .filter(collection => collection.id && collection.name && !formData.collections?.includes(collection.id))
                            .map((collection) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label>Active Item</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Type-Specific Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.type === "physical" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.weight}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              weight: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <div className="space-y-2">
                          <Input
                            id="stock"
                            type="number"
                            min="0"
                            value={unlimitedStock ? "" : formData.stock}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setFormData({
                                ...formData,
                                stock: value,
                              });
                            }}
                            placeholder="0"
                            disabled={unlimitedStock}
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="unlimited-stock"
                              checked={unlimitedStock}
                              onCheckedChange={(checked) => {
                                setUnlimitedStock(checked);
                                setFormData({
                                  ...formData,
                                  stock: checked ? -1 : 0,
                                });
                              }}
                            />
                            <Label htmlFor="unlimited-stock" className="text-sm">
                              Unlimited stock
                            </Label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="lowStock">Low Stock Alert</Label>
                        <Input
                          id="lowStock"
                          type="number"
                          min="0"
                          value={formData.lowStockAlert}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lowStockAlert: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="5"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.type === "digital" && (
                  <>
                    <div>
                      <Label htmlFor="downloadLink">Download Link</Label>
                      <Input
                        id="downloadLink"
                        value={formData.downloadLink}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            downloadLink: e.target.value,
                          })
                        }
                        placeholder="https://example.com/download"
                      />
                    </div>
                    <div>
                      <Label htmlFor="downloadNotes">Download Notes</Label>
                      <Textarea
                        id="downloadNotes"
                        value={formData.downloadNotes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            downloadNotes: e.target.value,
                          })
                        }
                        placeholder="Instructions for customers"
                        className="h-24"
                      />
                    </div>
                  </>
                )}

                {formData.type === "service" && (
                  <>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="0"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceNotes">Service Notes</Label>
                      <Textarea
                        id="serviceNotes"
                        value={formData.serviceNotes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            serviceNotes: e.target.value,
                          })
                        }
                        placeholder="Additional service information"
                        className="h-24"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Upload Area */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-center">
                      <Label htmlFor="image-upload" className="cursor-pointer text-sm font-medium">
                        Click to upload images
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, WEBP up to 10MB each
                      </p>
                    </div>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUploadLocal}
                      disabled={isUploading}
                      className="hidden"
                    />
                    {isUploading && (
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    )}
                  </div>
                </div>

                {/* Uploaded Images */}
                {formData.images && formData.images.length > 0 && (
                  <div>
                    <Label>Uploaded Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square overflow-hidden rounded-lg border">
                            <img
                              src={image.url}
                              alt={image.alt || `Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Cover Image Badge */}
                          {formData.coverImageIndex === index && (
                            <Badge className="absolute top-2 left-2 bg-primary">
                              <Star className="h-3 w-3 mr-1" />
                              Cover
                            </Badge>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex space-x-1">
                              {formData.coverImageIndex !== index && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleCoverImageChange(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => removeImage(index)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.images && formData.images.length === 0 && (
                  <div className="text-center py-8">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No images uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Predefined Attributes */}
                {availableAttributes.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Available Attributes</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {availableAttributes.map((attr) => {
                        const existingAttr = customAttributes.find(ca => ca.name === attr.name);
                        return (
                          <div key={attr.id} className="space-y-2">
                            <Label className="text-sm">{attr.name}</Label>
                            {attr.type === 'select' ? (
                              <Select
                                value={existingAttr?.value || ""}
                                onValueChange={(value) => {
                                  const index = customAttributes.findIndex(ca => ca.name === attr.name);
                                  if (index >= 0) {
                                    updateAttribute(index, "value", value);
                                  } else {
                                    const newAttrs = [...customAttributes, { name: attr.name, value }];
                                    setCustomAttributes(newAttrs);
                                    setFormData({
                                      ...formData,
                                      customAttributes: newAttrs.filter(a => a.name && a.value),
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${attr.name.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {attr.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : attr.type === 'boolean' ? (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={existingAttr?.value === 'true'}
                                  onCheckedChange={(checked) => {
                                    const index = customAttributes.findIndex(ca => ca.name === attr.name);
                                    if (index >= 0) {
                                      updateAttribute(index, "value", checked ? 'true' : 'false');
                                    } else {
                                      const newAttrs = [...customAttributes, { name: attr.name, value: checked ? 'true' : 'false' }];
                                      setCustomAttributes(newAttrs);
                                      setFormData({
                                        ...formData,
                                        customAttributes: newAttrs.filter(a => a.name && a.value),
                                      });
                                    }
                                  }}
                                />
                                <Label className="text-sm">{attr.description || 'Yes'}</Label>
                              </div>
                            ) : (
                              <Input
                                type={attr.type === 'number' ? 'number' : attr.type === 'color' ? 'color' : 'text'}
                                value={existingAttr?.value || ""}
                                onChange={(e) => {
                                  const index = customAttributes.findIndex(ca => ca.name === attr.name);
                                  if (index >= 0) {
                                    updateAttribute(index, "value", e.target.value);
                                  } else {
                                    const newAttrs = [...customAttributes, { name: attr.name, value: e.target.value }];
                                    setCustomAttributes(newAttrs);
                                    setFormData({
                                      ...formData,
                                      customAttributes: newAttrs.filter(a => a.name && a.value),
                                    });
                                  }
                                }}
                                placeholder={`Enter ${attr.name.toLowerCase()}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Attributes */}
                <div>
                  <Label className="text-sm font-medium">Custom Attributes</Label>
                  {customAttributes.filter(attr => !availableAttributes.some(aa => aa.name === attr.name)).length > 0 && (
                    <div className="space-y-3 mt-2">
                      {customAttributes.filter(attr => !availableAttributes.some(aa => aa.name === attr.name)).map((attr, index) => {
                        const actualIndex = customAttributes.findIndex(ca => ca === attr);
                        return (
                          <div key={actualIndex} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input
                              value={attr.name}
                              onChange={(e) =>
                                updateAttribute(actualIndex, "name", e.target.value)
                              }
                              placeholder="Attribute name"
                            />
                            <div className="flex gap-2">
                              <Input
                                value={attr.value}
                                onChange={(e) =>
                                  updateAttribute(actualIndex, "value", e.target.value)
                                }
                                placeholder="Attribute value"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeAttribute(actualIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button type="button" variant="outline" onClick={addAttribute} className="mt-2">
                    Add Custom Attribute
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="submit">
            {editItem ? "Update Item" : "Create Item"}
          </Button>
        </div>
      </form>
    </ScrollArea>
  );
}