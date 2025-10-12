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
import { Upload, X, Star, Image as ImageIcon, Shuffle, Plus, Trash2, Copy } from "lucide-react"; 

const ITEM_TYPES = [
  { value: "physical", label: "Physical Product" },
  { value: "digital", label: "Digital Product" },
  { value: "service", label: "Service" },
];

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
};

const generateSKU = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SKU-${timestamp}-${random}`;
};

export function CatalogItemForm({
  formData,
  setFormData,
  categories,
  collections,
  availableLanguages = ["en"],
  defaultLanguage = "en",
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
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);

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

  const updateSEOMultiLanguageField = (fieldName, langCode, value) => {
    const mlField = `${fieldName}ML`;
    setFormData({
      ...formData,
      seo: {
        ...formData.seo,
        [mlField]: {
          ...formData.seo[mlField],
          [langCode]: value
        },
        // Update the main field with default language value for backwards compatibility
        [fieldName]: langCode === defaultLanguage ? value : formData.seo[fieldName]
      }
    });
  };

  const getSEOMultiLanguageValue = (fieldName, langCode) => {
    const mlField = `${fieldName}ML`;
    return formData.seo[mlField]?.[langCode] || (langCode === defaultLanguage ? formData.seo[fieldName] : '') || '';
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
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
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="name">Name *</Label>
                      <div className="flex gap-1">
                        {availableLanguages.map(lang => (
                          <Button
                            key={lang}
                            type="button"
                            variant={currentLanguage === lang ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentLanguage(lang)}
                            className="h-6 px-2 text-xs"
                          >
                            {lang.toUpperCase()}
                            {lang === defaultLanguage && <span className="ml-1 text-xs">★</span>}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Input
                      id="name"
                      value={getMultiLanguageValue('name', currentLanguage)}
                      onChange={(e) => {
                        const name = e.target.value;
                        updateMultiLanguageField('name', currentLanguage, name);
                        // Auto-generate slug only for default language
                        if (currentLanguage === defaultLanguage) {
                          const currentSlug = formData.slug;
                          const generatedSlug = generateSlug(formData.nameML?.[defaultLanguage] || formData.name || '');
                          if (!currentSlug || currentSlug === generatedSlug) {
                            setFormData(prev => ({ ...prev, slug: generateSlug(name) }));
                          }
                        }
                      }}
                      placeholder={`Enter item name (${currentLanguage.toUpperCase()})`}
                      required={currentLanguage === defaultLanguage}
                    />
                    {currentLanguage !== defaultLanguage && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Translation for {currentLanguage.toUpperCase()}. Leave empty to use default language.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug || ''}
                    onChange={(e) => {
                      const slug = generateSlug(e.target.value);
                      setFormData({ ...formData, slug });
                    }}
                    placeholder="item-slug"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL-friendly version of the name. Auto-generated from name but can be edited.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <div className="flex gap-2">
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                        placeholder="Enter SKU"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setFormData({ ...formData, sku: generateSKU() })}
                        title="Generate SKU"
                      >
                        <Shuffle className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Stock Keeping Unit. Click the button to auto-generate.
                    </p>
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
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="description">Description</Label>
                    <div className="flex gap-1">
                      {availableLanguages.map(lang => (
                        <Button
                          key={lang}
                          type="button"
                          variant={currentLanguage === lang ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentLanguage(lang)}
                          className="h-6 px-2 text-xs"
                        >
                          {lang.toUpperCase()}
                          {lang === defaultLanguage && <span className="ml-1 text-xs">★</span>}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    id="description"
                    value={getMultiLanguageValue('description', currentLanguage)}
                    onChange={(e) =>
                      updateMultiLanguageField('description', currentLanguage, e.target.value)
                    }
                    placeholder={`Enter item description (${currentLanguage.toUpperCase()})`}
                    className="h-24"
                  />
                  {currentLanguage !== defaultLanguage && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Translation for {currentLanguage.toUpperCase()}. Leave empty to use default language.
                    </p>
                  )}
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

          <TabsContent value="attributes" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Variants & Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Variant Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.hasVariants}
                    onCheckedChange={(checked) => {
                      setFormData({ 
                        ...formData, 
                        hasVariants: checked,
                        variants: checked ? formData.variants : []
                      });
                    }}
                  />
                  <Label>This product has variants (different colors, sizes, etc.)</Label>
                </div>

                {formData.hasVariants ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Product Variants</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newVariant = {
                            id: Date.now(),
                            attributes: {},
                            stock: 0,
                            price: formData.price || 0,
                            sku: '',
                            coverImage: null,
                            unlimitedStock: false
                          };
                          setFormData({
                            ...formData,
                            variants: [...formData.variants, newVariant]
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variant
                      </Button>
                    </div>

                    {formData.variants && formData.variants.length > 0 ? (
                      <div className="space-y-4">
                        {formData.variants.map((variant, variantIndex) => (
                          <Card key={variant.id || variantIndex} className="p-4">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <Label className="font-medium">Variant {variantIndex + 1}</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newVariants = formData.variants.filter((_, i) => i !== variantIndex);
                                    setFormData({ ...formData, variants: newVariants });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Variant Attributes */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableAttributes.filter(attr => attr.isActive).map((attr) => (
                                  <div key={attr.id} className="space-y-2">
                                    <Label className="text-sm">{attr.name}</Label>
                                    {attr.type === 'select' ? (
                                      <Select
                                        value={variant.attributes[attr.name] || ""}
                                        onValueChange={(value) => {
                                          const newVariants = [...formData.variants];
                                          newVariants[variantIndex].attributes[attr.name] = value;
                                          setFormData({ ...formData, variants: newVariants });
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
                                    ) : attr.type === 'color' ? (
                                      <div className="flex gap-2">
                                        <Input
                                          type="color"
                                          value={variant.attributes[attr.name] || "#000000"}
                                          onChange={(e) => {
                                            const newVariants = [...formData.variants];
                                            newVariants[variantIndex].attributes[attr.name] = e.target.value;
                                            setFormData({ ...formData, variants: newVariants });
                                          }}
                                          className="w-16 h-10 p-1 rounded"
                                        />
                                        <Input
                                          type="text"
                                          value={variant.attributes[attr.name] || ""}
                                          onChange={(e) => {
                                            const newVariants = [...formData.variants];
                                            newVariants[variantIndex].attributes[attr.name] = e.target.value;
                                            setFormData({ ...formData, variants: newVariants });
                                          }}
                                          placeholder="Color name"
                                        />
                                      </div>
                                    ) : (
                                      <Input
                                        type={attr.type === 'number' ? 'number' : 'text'}
                                        value={variant.attributes[attr.name] || ""}
                                        onChange={(e) => {
                                          const newVariants = [...formData.variants];
                                          newVariants[variantIndex].attributes[attr.name] = e.target.value;
                                          setFormData({ ...formData, variants: newVariants });
                                        }}
                                        placeholder={`Enter ${attr.name.toLowerCase()}`}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Variant Details */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm">Variant SKU</Label>
                                  <Input
                                    value={variant.sku || ""}
                                    onChange={(e) => {
                                      const newVariants = [...formData.variants];
                                      newVariants[variantIndex].sku = e.target.value;
                                      setFormData({ ...formData, variants: newVariants });
                                    }}
                                    placeholder="Variant SKU"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">Price Adjustment</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={variant.price || 0}
                                    onChange={(e) => {
                                      const newVariants = [...formData.variants];
                                      newVariants[variantIndex].price = parseFloat(e.target.value) || 0;
                                      setFormData({ ...formData, variants: newVariants });
                                    }}
                                    placeholder="0.00"
                                  />
                                  <p className="text-xs text-muted-foreground">Additional cost for this variant</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">Stock Quantity</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={variant.unlimitedStock ? "" : variant.stock || 0}
                                    onChange={(e) => {
                                      const newVariants = [...formData.variants];
                                      newVariants[variantIndex].stock = parseInt(e.target.value) || 0;
                                      setFormData({ ...formData, variants: newVariants });
                                    }}
                                    placeholder="0"
                                    disabled={variant.unlimitedStock}
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={variant.unlimitedStock}
                                      onCheckedChange={(checked) => {
                                        const newVariants = [...formData.variants];
                                        newVariants[variantIndex].unlimitedStock = checked;
                                        if (checked) newVariants[variantIndex].stock = -1;
                                        setFormData({ ...formData, variants: newVariants });
                                      }}
                                    />
                                    <Label className="text-xs">Unlimited stock</Label>
                                  </div>
                                </div>
                              </div>

                              {/* Variant Cover Image */}
                              <div className="space-y-2">
                                <Label className="text-sm">Variant Cover Image</Label>
                                <div className="flex items-center gap-4">
                                  {variant.coverImage ? (
                                    <div className="relative">
                                      <img
                                        src={variant.coverImage}
                                        alt="Variant cover"
                                        className="w-16 h-16 object-cover rounded border"
                                      />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          const newVariants = [...formData.variants];
                                          newVariants[variantIndex].coverImage = null;
                                          setFormData({ ...formData, variants: newVariants });
                                        }}
                                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                                      <ImageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const uploadFormData = new FormData();
                                        uploadFormData.append('file', file);
                                        try {
                                          const response = await fetch('/api/upload', {
                                            method: 'POST',
                                            body: uploadFormData,
                                          });
                                          const data = await response.json();
                                          if (data.url) {
                                            const newVariants = [...formData.variants];
                                            newVariants[variantIndex].coverImage = data.url;
                                            setFormData({ ...formData, variants: newVariants });
                                          }
                                        } catch (error) {
                                          toast.error('Failed to upload image');
                                        }
                                      }
                                    }}
                                    className="flex-1"
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-4">No variants added yet</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newVariant = {
                              id: Date.now(),
                              attributes: {},
                              stock: 0,
                              price: 0,
                              sku: '',
                              coverImage: null,
                              unlimitedStock: false
                            };
                            setFormData({
                              ...formData,
                              variants: [newVariant]
                            });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Variant
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Attributes (Non-Variant Mode) */
                  <div className="space-y-4">
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO & Meta Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language Selector */}
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">SEO Language</Label>
                  <div className="flex gap-1">
                    {availableLanguages.map(lang => (
                      <Button
                        key={lang}
                        type="button"
                        variant={currentLanguage === lang ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentLanguage(lang)}
                        className="h-8 px-3 text-sm"
                      >
                        {lang.toUpperCase()}
                        {lang === defaultLanguage && <span className="ml-1">\u2605</span>}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Basic Meta Tags */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Basic Meta Tags ({currentLanguage.toUpperCase()})</Label>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={getSEOMultiLanguageValue("metaTitle", currentLanguage)}
                        onChange={(e) =>
                          updateSEOMultiLanguageField("metaTitle", currentLanguage, e.target.value)
                        }
                        placeholder={`SEO optimized title (50-60 characters) - ${currentLanguage.toUpperCase()}`}
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground">
                        {getSEOMultiLanguageValue("metaTitle", currentLanguage).length}/60 characters
                        {currentLanguage !== defaultLanguage && " - Translation for " + currentLanguage.toUpperCase()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={getSEOMultiLanguageValue("metaDescription", currentLanguage)}
                        onChange={(e) =>
                          updateSEOMultiLanguageField("metaDescription", currentLanguage, e.target.value)
                        }
                        placeholder={`Brief description for search results (150-160 characters) - ${currentLanguage.toUpperCase()}`}
                        maxLength={160}
                        className="h-20"
                      />
                      <p className="text-xs text-muted-foreground">
                        {getSEOMultiLanguageValue("metaDescription", currentLanguage).length}/160 characters
                        {currentLanguage !== defaultLanguage && " - Translation for " + currentLanguage.toUpperCase()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metaKeywords">Meta Keywords</Label>
                      <Input
                        id="metaKeywords"
                        value={getSEOMultiLanguageValue("metaKeywords", currentLanguage)}
                        onChange={(e) =>
                          updateSEOMultiLanguageField("metaKeywords", currentLanguage, e.target.value)
                        }
                        placeholder={`keyword1, keyword2, keyword3 - ${currentLanguage.toUpperCase()}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate keywords with commas
                        {currentLanguage !== defaultLanguage && " - Translation for " + currentLanguage.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Open Graph Tags */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Open Graph (Facebook) - {currentLanguage.toUpperCase()}</Label>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ogTitle">OG Title</Label>
                      <Input
                        id="ogTitle"
                        value={getSEOMultiLanguageValue("ogTitle", currentLanguage)}
                        onChange={(e) =>
                          updateSEOMultiLanguageField("ogTitle", currentLanguage, e.target.value)
                        }
                        placeholder={`Title for social media sharing - ${currentLanguage.toUpperCase()}`}
                      />
                      {currentLanguage !== defaultLanguage && (
                        <p className="text-xs text-muted-foreground">
                          Translation for {currentLanguage.toUpperCase()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ogDescription">OG Description</Label>
                      <Textarea
                        id="ogDescription"
                        value={getSEOMultiLanguageValue("ogDescription", currentLanguage)}
                        onChange={(e) =>
                          updateSEOMultiLanguageField("ogDescription", currentLanguage, e.target.value)
                        }
                        placeholder={`Description for social media sharing - ${currentLanguage.toUpperCase()}`}
                        className="h-20"
                      />
                      {currentLanguage !== defaultLanguage && (
                        <p className="text-xs text-muted-foreground">
                          Translation for {currentLanguage.toUpperCase()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ogImage">OG Image URL</Label>
                      <Input
                        id="ogImage"
                        type="url"
                        value={formData.seo?.ogImage || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            seo: { ...formData.seo, ogImage: e.target.value }
                          })
                        }
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Twitter Card Tags */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Twitter Card - {currentLanguage.toUpperCase()}</Label>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitterTitle">Twitter Title</Label>
                      <Input
                        id="twitterTitle"
                        value={getSEOMultiLanguageValue("twitterTitle", currentLanguage)}
                        onChange={(e) =>
                          updateSEOMultiLanguageField("twitterTitle", currentLanguage, e.target.value)
                        }
                        placeholder={`Title for Twitter sharing - ${currentLanguage.toUpperCase()}`}
                      />
                      {currentLanguage !== defaultLanguage && (
                        <p className="text-xs text-muted-foreground">
                          Translation for {currentLanguage.toUpperCase()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitterDescription">Twitter Description</Label>
                      <Textarea
                        id="twitterDescription"
                        value={getSEOMultiLanguageValue("twitterDescription", currentLanguage)}
                        onChange={(e) =>
                          updateSEOMultiLanguageField("twitterDescription", currentLanguage, e.target.value)
                        }
                        placeholder={`Description for Twitter sharing - ${currentLanguage.toUpperCase()}`}
                        className="h-20"
                      />
                      {currentLanguage !== defaultLanguage && (
                        <p className="text-xs text-muted-foreground">
                          Translation for {currentLanguage.toUpperCase()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitterImage">Twitter Image URL</Label>
                      <Input
                        id="twitterImage"
                        type="url"
                        value={formData.seo?.twitterImage || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            seo: { ...formData.seo, twitterImage: e.target.value }
                          })
                        }
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* SEO Preview */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Search Result Preview - {currentLanguage.toUpperCase()}</Label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="space-y-1">
                      <div className="text-blue-600 text-lg font-medium line-clamp-1">
                        {getSEOMultiLanguageValue("metaTitle", currentLanguage) || getMultiLanguageValue('name', currentLanguage) || "Your Product Title"}
                      </div>
                      <div className="text-green-700 text-sm">
                        yoursite.com/{currentLanguage !== defaultLanguage ? currentLanguage + '/' : ''}products/{formData.slug || "product-slug"}
                      </div>
                      <div className="text-gray-600 text-sm line-clamp-2">
                        {getSEOMultiLanguageValue("metaDescription", currentLanguage) || getMultiLanguageValue('description', currentLanguage) || "Your product description will appear here in search results..."}
                      </div>
                    </div>
                    {currentLanguage !== defaultLanguage && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        Preview for {currentLanguage.toUpperCase()} language version
                      </p>
                    )}
                  </div>
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