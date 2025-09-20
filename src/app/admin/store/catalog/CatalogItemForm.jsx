"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  isSubmitting,
  editMode = false,
}) {
  const [customAttributes, setCustomAttributes] = useState([
    { name: "", value: "" },
  ]);

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

  const handleImagesChange = (newImages) => {
    setFormData({ ...formData, images: newImages });
  };

  const handleCoverImageChange = (index) => {
    setFormData({ ...formData, coverImageIndex: index });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label>Item Type</Label>
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
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>SKU</Label>
              <Input
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
              <div>
                <Label>Compare at Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compareAtPrice: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Collections</Label>
              <Select
                value={formData.collections}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    collections: Array.isArray(value) ? value : [value],
                  })
                }
                multiple
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collections" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="h-[150px]"
              />
            </div>

            {formData.type === "physical" && (
              <>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Low Stock Alert</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.lowStockAlert}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lowStockAlert: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {formData.type === "digital" && (
              <>
                <div>
                  <Label>Download Link</Label>
                  <Input
                    value={formData.downloadLink}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        downloadLink: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Download Notes</Label>
                  <Textarea
                    value={formData.downloadNotes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        downloadNotes: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}

            {formData.type === "service" && (
              <>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Service Notes</Label>
                  <Textarea
                    value={formData.serviceNotes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serviceNotes: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Label>Custom Attributes</Label>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customAttributes.map((attr, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={attr.name}
                      onChange={(e) =>
                        updateAttribute(index, "name", e.target.value)
                      }
                      placeholder="Attribute name"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={attr.value}
                      onChange={(e) =>
                        updateAttribute(index, "value", e.target.value)
                      }
                      placeholder="Attribute value"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeAttribute(index)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button type="button" variant="outline" onClick={addAttribute}>
            Add Attribute
          </Button>
        </div>

        <div className="space-y-4">
          <Label>Images</Label>
          {/* 
          <ImageUpload
            images={formData.images}
            onImagesChange={handleImagesChange}
            coverImageIndex={formData.coverImageIndex}
            onCoverImageChange={handleCoverImageChange}
          />
          */}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isActive: checked })
            }
          />
          <Label>Active</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : editMode
            ? "Update Item"
            : "Create Item"}
        </Button>
      </div>
    </form>
  );
}