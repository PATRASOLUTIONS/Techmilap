"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FavoriteSpeakerButtonProps {
  speakerId: string;
  initialIsFavorite?: boolean;
}

export default function FavoriteSpeakerButton({ speakerId, initialIsFavorite = false }: FavoriteSpeakerButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFavorite = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/users/favorite-speaker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ speakerId }),
      });

      if (response.ok) {
        setIsFavorite(true);
        toast({
          title: "Success",
          description: "Speaker added to favorites.",
          variant: "success",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to add favorite speaker.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={isFavorite ? "default" : "secondary"} className="flex-1" onClick={handleFavorite} disabled={loading || isFavorite}>
      {isFavorite ? "★ Favorited" : "☆ Favorite"}
    </Button>
  );
}
