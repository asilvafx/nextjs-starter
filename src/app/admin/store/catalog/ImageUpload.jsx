"use client";"use client";



import { useCallback, useState } from "react";import { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";import { Upload } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";import { Button } from "@/components/ui/button";

import {import { Input } from "@/components/ui/input";

  Card,import { ScrollArea } from "@/components/ui/scroll-area";

  CardContent,import Image from "next/image";

} from "@/components/ui/card";import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { cn } from "@/lib/utils";

import { Upload, X, Star } from "lucide-react";export default function ImageUpload({

import { toast } from "sonner";  images = [],

  onImagesChange,

export default function ImageUpload({  maxImages = 10,

  images = [],  coverImageIndex,

  onImagesChange,  onCoverImageChange,

  coverImageIndex = 0,}) {

  onCoverImageChange,  // Removed unused draggedImage state

  maxFiles = 10,

  maxSize = 5, // in MB  const handleDragEnd = useCallback(

}) {    (result) => {

  const [isDragging, setIsDragging] = useState(false);      if (!result.destination) return;



  const handleDragOver = useCallback((e) => {      const newImages = Array.from(images);

    e.preventDefault();      const [reorderedImage] = newImages.splice(result.source.index, 1);

    e.stopPropagation();      newImages.splice(result.destination.index, 0, reorderedImage);

    setIsDragging(true);

  }, []);      if (coverImageIndex === result.source.index) {

        onCoverImageChange(result.destination.index);

  const handleDragLeave = useCallback((e) => {      } else if (

    e.preventDefault();        coverImageIndex === result.destination.index &&

    e.stopPropagation();        result.source.index < result.destination.index

    setIsDragging(false);      ) {

  }, []);        onCoverImageChange(coverImageIndex - 1);

      } else if (

  const validateFile = (file) => {        coverImageIndex === result.destination.index &&

    // Check file size        result.source.index > result.destination.index

    if (file.size > maxSize * 1024 * 1024) {      ) {

      toast.error(`File size should be less than ${maxSize}MB`);        onCoverImageChange(coverImageIndex + 1);

      return false;      } else if (

    }        coverImageIndex > result.source.index &&

        coverImageIndex < result.destination.index

    // Check file type      ) {

    if (!file.type.startsWith("image/")) {        onCoverImageChange(coverImageIndex - 1);

      toast.error("Only image files are allowed");      } else if (

      return false;        coverImageIndex < result.source.index &&

    }        coverImageIndex > result.destination.index

      ) {

    return true;        onCoverImageChange(coverImageIndex + 1);

  };      }



  const processFiles = useCallback(async (files) => {      onImagesChange(newImages);

    if (images.length + files.length > maxFiles) {    },

      toast.error(`Maximum ${maxFiles} images allowed`);    [images, coverImageIndex, onImagesChange, onCoverImageChange]

      return;  );

    }

  const handleFileSelect = useCallback(

    const newImages = [];    (e) => {

      const files = Array.from(e.target.files);

    for (const file of files) {      if (files.length === 0) return;

      if (!validateFile(file)) continue;

      const remainingSlots = maxImages - images.length;

      try {      if (remainingSlots <= 0) {

        // Create URL for preview        alert(`Maximum ${maxImages} images allowed`);

        const imageUrl = URL.createObjectURL(file);        return;

        newImages.push({      }

          file,

          url: imageUrl,      const filesToProcess = files.slice(0, remainingSlots);

          alt: file.name,

        });      Promise.all(

      } catch (error) {        filesToProcess.map((file) => {

        console.error("Error processing file:", error);          return new Promise((resolve) => {

        toast.error(`Error processing ${file.name}`);            const reader = new FileReader();

      }            reader.onloadend = () => {

    }              resolve({

                file,

    onImagesChange([...images, ...newImages]);                preview: reader.result,

  }, [images, maxFiles, maxSize, onImagesChange]);                alt: "",

              });

  const handleDrop = useCallback((e) => {            };

    e.preventDefault();            reader.readAsDataURL(file);

    e.stopPropagation();          });

    setIsDragging(false);        })

      ).then((newImages) => {

    const files = Array.from(e.dataTransfer.files);        onImagesChange([...images, ...newImages]);

    processFiles(files);      });

  }, [processFiles]);    },

    [images, maxImages, onImagesChange]

  const handleFileSelect = useCallback((e) => {  );

    const files = Array.from(e.target.files || []);

    processFiles(files);  const handleAltChange = useCallback(

    e.target.value = null; // Reset input    (index, alt) => {

  }, [processFiles]);      const newImages = [...images];

      newImages[index] = { ...newImages[index], alt };

  const handleRemoveImage = useCallback((index) => {      onImagesChange(newImages);

    const newImages = images.filter((_, i) => i !== index);    },

    onImagesChange(newImages);    [images, onImagesChange]

      );

    // Update cover image index if needed

    if (index === coverImageIndex) {  const handleDelete = useCallback(

      onCoverImageChange(0);    (index) => {

    } else if (index < coverImageIndex) {      const newImages = images.filter((_, i) => i !== index);

      onCoverImageChange(coverImageIndex - 1);      onImagesChange(newImages);

    }      if (coverImageIndex === index) {

  }, [images, coverImageIndex, onImagesChange, onCoverImageChange]);        onCoverImageChange(0);

      } else if (coverImageIndex > index) {

  return (        onCoverImageChange(coverImageIndex - 1);

    <div className="space-y-4">      }

      <div    },

        onDragOver={handleDragOver}    [images, coverImageIndex, onImagesChange, onCoverImageChange]

        onDragLeave={handleDragLeave}  );

        onDrop={handleDrop}

        className={cn(  return (

          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",    <div className="space-y-4">

          isDragging      <div className="flex items-center gap-4">

            ? "border-primary bg-primary/5"        <Input

            : "border-muted-foreground/25"          type="file"

        )}          accept="image/*"

      >          multiple

        <input          onChange={handleFileSelect}

          type="file"          className="hidden"

          accept="image/*"          id="image-upload"

          multiple        />

          onChange={handleFileSelect}        <Button

          className="hidden"          variant="outline"

          id="image-upload"          onClick={() => document.getElementById("image-upload").click()}

        />          disabled={images.length >= maxImages}

        <label        >

          htmlFor="image-upload"          <Upload className="w-4 h-4 mr-2" />

          className="flex flex-col items-center gap-2 cursor-pointer"          Upload Images

        >        </Button>

          <Upload className="h-8 w-8 text-muted-foreground" />        <span className="text-sm text-muted-foreground">

          <div className="text-muted-foreground">          {images.length}/{maxImages} images

            <span className="font-semibold text-primary">Click to upload</span> or        </span>

            drag and drop      </div>

          </div>

          <div className="text-xs text-muted-foreground">      <ScrollArea className="h-[300px] border rounded-md p-4">

            Images (up to {maxFiles} files, max {maxSize}MB each)        <DragDropContext onDragEnd={handleDragEnd}>

          </div>          <Droppable droppableId="images">

        </label>            {(provided) => (

      </div>              <div

                {...provided.droppableProps}

      {images.length > 0 && (                ref={provided.innerRef}

        <ScrollArea className="h-[300px] w-full rounded-md border">                className="space-y-4"

          <div className="grid grid-cols-3 gap-4 p-4">              >

            {images.map((image, index) => (                {images.map((image, index) => (

              <Card key={index} className="relative group">                  <Draggable

                <CardContent className="p-2">                    key={index}

                  <div className="relative aspect-square">                    draggableId={String(index)}

                    <img                    index={index}

                      src={image.url}                  >

                      alt={image.alt}                    {(provided, snapshot) => (

                      className="rounded-md object-cover w-full h-full"                      <div

                    />                        ref={provided.innerRef}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-md">                        {...provided.draggableProps}

                      <div className="flex gap-2">                        {...provided.dragHandleProps}

                        <Button                        className={`flex items-center gap-4 p-2 border rounded-md ${

                          variant="secondary"                          snapshot.isDragging ? "bg-muted" : ""

                          size="icon"                        } ${coverImageIndex === index ? "border-primary" : ""}`}

                          onClick={() => handleRemoveImage(index)}                      >

                        >                        <div className="relative w-20 h-20">

                          <X className="h-4 w-4" />                          <Image

                        </Button>                            src={image.preview}

                        <Button                            alt={image.alt}

                          variant={coverImageIndex === index ? "default" : "secondary"}                            fill={true}

                          size="icon"                            unoptimized={true}

                          onClick={() => onCoverImageChange(index)}                            className="object-cover rounded-md"

                        >                          />

                          <Star className="h-4 w-4" />                        </div>

                        </Button>                        <div className="flex-1 space-y-2">

                      </div>                          <Input

                    </div>                            placeholder="Image alt text"

                    {coverImageIndex === index && (                            value={image.alt}

                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">                            onChange={(e) => handleAltChange(index, e.target.value)}

                        <Star className="h-3 w-3" />                          />

                      </div>                          <div className="flex gap-2">

                    )}                            <Button

                  </div>                              variant={

                </CardContent>                                coverImageIndex === index ? "default" : "outline"

              </Card>                              }

            ))}                              size="sm"

          </div>                              onClick={() => onCoverImageChange(index)}

        </ScrollArea>                            >

      )}                              {coverImageIndex === index

    </div>                                ? "Cover Image"

  );                                : "Set as Cover"}

}                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(index)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </ScrollArea>
    </div>
  );
}