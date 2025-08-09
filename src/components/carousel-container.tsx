"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "@/lib/utils";

interface CarouselContainerProps {
  className?: string;
  items: {
    component: React.ReactNode;
    title: string;
  }[];
}

const CarouselContainer: React.FC<CarouselContainerProps> = ({
  items,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetCarousel = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === items.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
  }, [items]);

  const pauseCarousel = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resumeCarousel = useCallback(() => {
    if (!intervalRef.current) {
      resetCarousel();
    }
  }, [resetCarousel]);

  useEffect(() => {
    resetCarousel();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [resetCarousel]);

  const handleMoveLeft = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? items.length - 1 : prevIndex - 1
    );
    resetCarousel();
  };

  const handleMoveRight = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === items.length - 1 ? 0 : prevIndex + 1
    );
    resetCarousel();
  };

  const handleTabChange = (value: string) => {
    setCurrentIndex(Number(value));
    resetCarousel();
  };

  const handleMouseEnter = () => {
    pauseCarousel();
  };

  const handleMouseLeave = () => {
    resumeCarousel();
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-full h-full overflow-hidden p-2 flex flex-col items-center",
        className
      )}
    >
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden gap-1 flex-1"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="overflow-hidden flex-1 h-full">
          <div
            className="flex transition-transform duration-300 ease-in-out h-full"
            style={{
              width: `${items.length * 100}%`,
              transform: `translateX(-${(currentIndex * 100) / items.length}%)`,
            }}
          >
            {items.map((item, index) => (
              <div key={index} style={{ width: `${100 / items.length}%` }}>
                {item.component}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={handleMoveLeft} variant="secondary" size="icon">
          <ChevronLeft />
        </Button>
        <Tabs value={String(currentIndex)} onValueChange={handleTabChange}>
          <TabsList>
            {items.map((item, index) => (
              <TabsTrigger key={index} value={String(index)}>
                {item.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={handleMoveRight} variant="secondary" size="icon">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
};

export default CarouselContainer;
