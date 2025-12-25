"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface Feature {
  title: string;
  description: string;
  image: string;
}

interface FeatureCarouselProps {
  features: Feature[];
}

export default function FeatureCarousel({ features }: FeatureCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <div className="relative px-4 sm:px-0">
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="min-w-full shrink-0 rounded-xl bg-white p-6 shadow-lg"
            >
              <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-0 sm:-translate-x-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Previous feature"
      >
        <ChevronLeft className="h-5 w-5 text-gray-900" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-0 sm:translate-x-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Next feature"
      >
        <ChevronRight className="h-5 w-5 text-gray-900" />
      </button>

      {/* Dots Indicator */}
      <div className="mt-6 flex justify-center gap-2">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? "w-8 bg-gray-900"
                : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

