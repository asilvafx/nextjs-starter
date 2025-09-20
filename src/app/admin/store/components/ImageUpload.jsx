"use client";"use client";"use client";"use client";



import { useState, useCallback } from "react";

import { Upload, X, Star } from "lucide-react";

import { Button } from "@/components/ui/button";import { useState, useCallback } from "react";

import { Input } from "@/components/ui/input";

import { ScrollArea } from "@/components/ui/scroll-area";import { Upload } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { toast } from "sonner";import { Button } from "@/components/ui/button";import { useCallback, useState } from "react";import { useState, useCallback } from "react";

import { cn } from "@/lib/utils";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";import { Input } from "@/components/ui/input";

import Image from "next/image";

import { ScrollArea } from "@/components/ui/scroll-area";import { Button } from "@/components/ui/button";import { Upload } from "lucide-react";

export default function ImageUpload({

  images = [],import Image from "next/image";

  onImagesChange,

  maxImages = 10,import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";import { ScrollArea } from "@/components/ui/scroll-area";import { Button } from "@/components/ui/button";

  coverImageIndex = 0,

  onCoverImageChange,

  maxSize = 5, // in MB

}) {export default function ImageUpload({import {import { Input } from "@/components/ui/input";

  const [isDragging, setIsDragging] = useState(false);

  images = [],

  const validateFile = (file) => {

    // Check file size  onImagesChange,  Card,import { ScrollArea } from "@/components/ui/scroll-area";

    if (file.size > maxSize * 1024 * 1024) {

      toast.error(`File size should be less than ${maxSize}MB`);  maxImages = 10,

      return false;

    }  coverImageIndex,  CardContent,import Image from "next/image";



    // Check file type  onCoverImageChange,

    if (!file.type.startsWith("image/")) {

      toast.error("Only image files are allowed");}) {} from "@/components/ui/card";import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

      return false;

    }  const handleDragEnd = useCallback(



    return true;    (result) => {import { cn } from "@/lib/utils";

  };

      if (!result.destination) return;

  const processFiles = useCallback(

    async (files) => {import { Upload, X, Star } from "lucide-react";export default function ImageUpload({

      if (images.length + files.length > maxImages) {

        toast.error(`Maximum ${maxImages} images allowed`);      const newImages = Array.from(images);

        return;

      }      const [reorderedImage] = newImages.splice(result.source.index, 1);import { toast } from "sonner";  images = [],



      const filesToProcess = files.slice(0, maxImages - images.length);      newImages.splice(result.destination.index, 0, reorderedImage);



      Promise.all(  onImagesChange,

        filesToProcess.map((file) => {

          if (!validateFile(file)) return null;      // Update cover image index when dragging



          return new Promise((resolve) => {      if (coverImageIndex === result.source.index) {export default function ImageUpload({  maxImages = 10,

            const reader = new FileReader();

            reader.onloadend = () => {        onCoverImageChange(result.destination.index);

              resolve({

                file,      } else if (  images = [],  coverImageIndex,

                preview: reader.result,

                alt: file.name,        coverImageIndex === result.destination.index &&

              });

            };        result.source.index < result.destination.index  onImagesChange,  onCoverImageChange,

            reader.readAsDataURL(file);

          });      ) {

        })

      ).then((newImages) => {        onCoverImageChange(coverImageIndex - 1);  coverImageIndex = 0,}) {

        const validImages = newImages.filter((img) => img !== null);

        if (validImages.length > 0) {      } else if (

          onImagesChange([...images, ...validImages]);

        }        coverImageIndex === result.destination.index &&  onCoverImageChange,  // Removed unused draggedImage state

      });

    },        result.source.index > result.destination.index

    [images, maxImages, onImagesChange]

  );      ) {  maxFiles = 10,



  const handleDragOver = useCallback((e) => {        onCoverImageChange(coverImageIndex + 1);

    e.preventDefault();

    e.stopPropagation();      } else if (  maxSize = 5, // in MB  const handleDragEnd = useCallback(

    setIsDragging(true);

  }, []);        coverImageIndex > result.source.index &&



  const handleDragLeave = useCallback((e) => {        coverImageIndex < result.destination.index}) {    (result) => {

    e.preventDefault();

    e.stopPropagation();      ) {

    setIsDragging(false);

  }, []);        onCoverImageChange(coverImageIndex - 1);  const [isDragging, setIsDragging] = useState(false);      if (!result.destination) return;



  const handleDrop = useCallback(      } else if (

    (e) => {

      e.preventDefault();        coverImageIndex < result.source.index &&

      e.stopPropagation();

      setIsDragging(false);        coverImageIndex > result.destination.index



      const files = Array.from(e.dataTransfer.files);      ) {  const handleDragOver = useCallback((e) => {      const newImages = Array.from(images);

      processFiles(files);

    },        onCoverImageChange(coverImageIndex + 1);

    [processFiles]

  );      }    e.preventDefault();      const [reorderedImage] = newImages.splice(result.source.index, 1);



  const handleFileSelect = useCallback(

    (e) => {

      const files = Array.from(e.target.files || []);      onImagesChange(newImages);    e.stopPropagation();      newImages.splice(result.destination.index, 0, reorderedImage);

      processFiles(files);

      e.target.value = null; // Reset input    },

    },

    [processFiles]    [images, coverImageIndex, onImagesChange, onCoverImageChange]    setIsDragging(true);

  );

  );

  const handleDragEnd = useCallback(

    (result) => {  }, []);      if (coverImageIndex === result.source.index) {

      if (!result.destination) return;

  const handleFileSelect = useCallback(

      const newImages = Array.from(images);

      const [reorderedImage] = newImages.splice(result.source.index, 1);    (e) => {        onCoverImageChange(result.destination.index);

      newImages.splice(result.destination.index, 0, reorderedImage);

      const files = Array.from(e.target.files);

      // Update cover image index when dragging

      if (coverImageIndex === result.source.index) {      if (files.length === 0) return;  const handleDragLeave = useCallback((e) => {      } else if (

        onCoverImageChange(result.destination.index);

      } else if (

        coverImageIndex === result.destination.index &&

        result.source.index < result.destination.index      const remainingSlots = maxImages - images.length;    e.preventDefault();        coverImageIndex === result.destination.index &&

      ) {

        onCoverImageChange(coverImageIndex - 1);      if (remainingSlots <= 0) {

      } else if (

        coverImageIndex === result.destination.index &&        alert(`Maximum ${maxImages} images allowed`);    e.stopPropagation();        result.source.index < result.destination.index

        result.source.index > result.destination.index

      ) {        return;

        onCoverImageChange(coverImageIndex + 1);

      } else if (      }    setIsDragging(false);      ) {

        coverImageIndex > result.source.index &&

        coverImageIndex < result.destination.index

      ) {

        onCoverImageChange(coverImageIndex - 1);      const filesToProcess = files.slice(0, remainingSlots);  }, []);        onCoverImageChange(coverImageIndex - 1);

      } else if (

        coverImageIndex < result.source.index &&

        coverImageIndex > result.destination.index

      ) {      Promise.all(      } else if (

        onCoverImageChange(coverImageIndex + 1);

      }        filesToProcess.map((file) => {



      onImagesChange(newImages);          return new Promise((resolve) => {  const validateFile = (file) => {        coverImageIndex === result.destination.index &&

    },

    [images, coverImageIndex, onImagesChange, onCoverImageChange]            const reader = new FileReader();

  );

            reader.onloadend = () => {    // Check file size        result.source.index > result.destination.index

  const handleAltChange = useCallback(

    (index, alt) => {              resolve({

      const newImages = [...images];

      newImages[index] = { ...newImages[index], alt };                file,    if (file.size > maxSize * 1024 * 1024) {      ) {

      onImagesChange(newImages);

    },                preview: reader.result,

    [images, onImagesChange]

  );                alt: "",      toast.error(`File size should be less than ${maxSize}MB`);        onCoverImageChange(coverImageIndex + 1);



  const handleDelete = useCallback(              });

    (index) => {

      const newImages = images.filter((_, i) => i !== index);            };      return false;      } else if (

      onImagesChange(newImages);

            reader.readAsDataURL(file);

      if (coverImageIndex === index) {

        onCoverImageChange(0);          });    }        coverImageIndex > result.source.index &&

      } else if (coverImageIndex > index) {

        onCoverImageChange(coverImageIndex - 1);        })

      }

    },      ).then((newImages) => {        coverImageIndex < result.destination.index

    [images, coverImageIndex, onImagesChange, onCoverImageChange]

  );        onImagesChange([...images, ...newImages]);



  return (      });    // Check file type      ) {

    <div className="space-y-4">

      <div    },

        onDragOver={handleDragOver}

        onDragLeave={handleDragLeave}    [images, maxImages, onImagesChange]    if (!file.type.startsWith("image/")) {        onCoverImageChange(coverImageIndex - 1);

        onDrop={handleDrop}

        className={cn(  );

          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",

          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"      toast.error("Only image files are allowed");      } else if (

        )}

      >  const handleAltChange = useCallback(

        <input

          type="file"    (index, alt) => {      return false;        coverImageIndex < result.source.index &&

          accept="image/*"

          multiple      const newImages = [...images];

          onChange={handleFileSelect}

          className="hidden"      newImages[index] = { ...newImages[index], alt };    }        coverImageIndex > result.destination.index

          id="image-upload"

        />      onImagesChange(newImages);

        <label

          htmlFor="image-upload"    },      ) {

          className="flex flex-col items-center gap-2 cursor-pointer"

        >    [images, onImagesChange]

          <Upload className="h-8 w-8 text-muted-foreground" />

          <div className="text-muted-foreground">  );    return true;        onCoverImageChange(coverImageIndex + 1);

            <span className="font-semibold text-primary">Click to upload</span> or

            drag and drop

          </div>

          <div className="text-xs text-muted-foreground">  const handleDelete = useCallback(  };      }

            Images (up to {maxImages} files, max {maxSize}MB each)

          </div>    (index) => {

          <div className="text-sm text-muted-foreground mt-2">

            {images.length}/{maxImages} images uploaded      const newImages = images.filter((_, i) => i !== index);

          </div>

        </label>      onImagesChange(newImages);

      </div>

  const processFiles = useCallback(async (files) => {      onImagesChange(newImages);

      {images.length > 0 && (

        <DragDropContext onDragEnd={handleDragEnd}>      if (coverImageIndex === index) {

          <Droppable droppableId="images">

            {(provided) => (        onCoverImageChange(0);    if (images.length + files.length > maxFiles) {    },

              <ScrollArea className="h-[300px] w-full rounded-md border">

                <div      } else if (coverImageIndex > index) {

                  {...provided.droppableProps}

                  ref={provided.innerRef}        onCoverImageChange(coverImageIndex - 1);      toast.error(`Maximum ${maxFiles} images allowed`);    [images, coverImageIndex, onImagesChange, onCoverImageChange]

                  className="p-4 space-y-4"

                >      }

                  {images.map((image, index) => (

                    <Draggable    },      return;  );

                      key={index}

                      draggableId={String(index)}    [images, coverImageIndex, onImagesChange, onCoverImageChange]

                      index={index}

                    >  );    }

                      {(provided, snapshot) => (

                        <Card

                          ref={provided.innerRef}

                          {...provided.draggableProps}  return (  const handleFileSelect = useCallback(

                          {...provided.dragHandleProps}

                          className={cn("relative", snapshot.isDragging && "bg-muted")}    <div className="space-y-4">

                        >

                          <CardContent className="p-4">      <div className="flex items-center gap-4">    const newImages = [];    (e) => {

                            <div className="flex items-center gap-4">

                              <div className="relative w-20 h-20">        <Input

                                <img

                                  src={image.preview || image.url}          type="file"      const files = Array.from(e.target.files);

                                  alt={image.alt}

                                  className="w-full h-full object-cover rounded-md"          accept="image/*"

                                />

                                {coverImageIndex === index && (          multiple    for (const file of files) {      if (files.length === 0) return;

                                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">

                                    <Star className="h-3 w-3" />          onChange={handleFileSelect}

                                  </div>

                                )}          className="hidden"      if (!validateFile(file)) continue;

                              </div>

                              <div className="flex-1 space-y-2">          id="image-upload"

                                <Input

                                  placeholder="Image alt text"        />      const remainingSlots = maxImages - images.length;

                                  value={image.alt}

                                  onChange={(e) => handleAltChange(index, e.target.value)}        <Button

                                />

                                <div className="flex gap-2">          variant="outline"      try {      if (remainingSlots <= 0) {

                                  <Button

                                    variant={coverImageIndex === index ? "default" : "outline"}          onClick={() => document.getElementById("image-upload").click()}

                                    size="sm"

                                    onClick={() => onCoverImageChange(index)}          disabled={images.length >= maxImages}        // Create URL for preview        alert(`Maximum ${maxImages} images allowed`);

                                  >

                                    {coverImageIndex === index        >

                                      ? "Cover Image"

                                      : "Set as Cover"}          <Upload className="w-4 h-4 mr-2" />        const imageUrl = URL.createObjectURL(file);        return;

                                  </Button>

                                  <Button          Upload Images

                                    variant="destructive"

                                    size="sm"        </Button>        newImages.push({      }

                                    onClick={() => handleDelete(index)}

                                  >        <span className="text-sm text-muted-foreground">

                                    Delete

                                  </Button>          {images.length}/{maxImages} images          file,

                                </div>

                              </div>        </span>

                            </div>

                          </CardContent>      </div>          url: imageUrl,      const filesToProcess = files.slice(0, remainingSlots);

                        </Card>

                      )}

                    </Draggable>

                  ))}      <ScrollArea className="h-[300px] border rounded-md p-4">          alt: file.name,

                  {provided.placeholder}

                </div>        <DragDropContext onDragEnd={handleDragEnd}>

              </ScrollArea>

            )}          <Droppable droppableId="images">        });      Promise.all(

          </Droppable>

        </DragDropContext>            {(provided) => (

      )}

    </div>              <div      } catch (error) {        filesToProcess.map((file) => {

  );

}                {...provided.droppableProps}

                ref={provided.innerRef}        console.error("Error processing file:", error);          return new Promise((resolve) => {

                className="space-y-4"

              >        toast.error(`Error processing ${file.name}`);            const reader = new FileReader();

                {images.map((image, index) => (

                  <Draggable      }            reader.onloadend = () => {

                    key={index}

                    draggableId={String(index)}    }              resolve({

                    index={index}

                  >                file,

                    {(provided, snapshot) => (

                      <div    onImagesChange([...images, ...newImages]);                preview: reader.result,

                        ref={provided.innerRef}

                        {...provided.draggableProps}  }, [images, maxFiles, maxSize, onImagesChange]);                alt: "",

                        {...provided.dragHandleProps}

                        className={`flex items-center gap-4 p-2 border rounded-md ${              });

                          snapshot.isDragging ? "bg-muted" : ""

                        } ${coverImageIndex === index ? "border-primary" : ""}`}  const handleDrop = useCallback((e) => {            };

                      >

                        <div className="relative w-20 h-20">    e.preventDefault();            reader.readAsDataURL(file);

                          <Image

                            src={image.preview}    e.stopPropagation();          });

                            alt={image.alt}

                            fill={true}    setIsDragging(false);        })

                            unoptimized={true}

                            className="object-cover rounded-md"      ).then((newImages) => {

                          />

                        </div>    const files = Array.from(e.dataTransfer.files);        onImagesChange([...images, ...newImages]);

                        <div className="flex-1 space-y-2">

                          <Input    processFiles(files);      });

                            placeholder="Image alt text"

                            value={image.alt}  }, [processFiles]);    },

                            onChange={(e) => handleAltChange(index, e.target.value)}

                          />    [images, maxImages, onImagesChange]

                          <div className="flex gap-2">

                            <Button  const handleFileSelect = useCallback((e) => {  );

                              variant={

                                coverImageIndex === index ? "default" : "outline"    const files = Array.from(e.target.files || []);

                              }

                              size="sm"    processFiles(files);  const handleAltChange = useCallback(

                              onClick={() => onCoverImageChange(index)}

                            >    e.target.value = null; // Reset input    (index, alt) => {

                              {coverImageIndex === index

                                ? "Cover Image"  }, [processFiles]);      const newImages = [...images];

                                : "Set as Cover"}

                            </Button>      newImages[index] = { ...newImages[index], alt };

                            <Button

                              variant="destructive"  const handleRemoveImage = useCallback((index) => {      onImagesChange(newImages);

                              size="sm"

                              onClick={() => handleDelete(index)}    const newImages = images.filter((_, i) => i !== index);    },

                            >

                              Delete    onImagesChange(newImages);    [images, onImagesChange]

                            </Button>

                          </div>      );

                        </div>

                      </div>    // Update cover image index if needed

                    )}

                  </Draggable>    if (index === coverImageIndex) {  const handleDelete = useCallback(

                ))}

                {provided.placeholder}      onCoverImageChange(0);    (index) => {

              </div>

            )}    } else if (index < coverImageIndex) {      const newImages = images.filter((_, i) => i !== index);

          </Droppable>

        </DragDropContext>      onCoverImageChange(coverImageIndex - 1);      onImagesChange(newImages);

      </ScrollArea>

    </div>    }      if (coverImageIndex === index) {

  );

}  }, [images, coverImageIndex, onImagesChange, onCoverImageChange]);        onCoverImageChange(0);

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