import Image from "next/image";
import React from "react";

type ReviewsCarouselProps = {
  autoSlide: boolean;
  interval?: number;
};

type Review = {
  content: string;
  authorName: string;
  authorPhoto: string;
  isVerified: boolean;
};

const reviews: Review[] = [
  {
    content:
      "Feedbird creates social media content that is better and less expensive than what we can do in-house. The process is smooth and helped reduce our monthly time spent on content from 8 hours to 15 minutes.",
    authorName: "Scott Regan",
    authorPhoto: "/images/checkout/reviews/review1.png",
    isVerified: true,
  },
  {
    content:
      "Feedbird creates social media content that is better and less expensive than what we can do in-house. The process is smooth and helped reduce our monthly time spent on content from 8 hours to 15 minutes.",
    authorName: "Scott Regan",
    authorPhoto: "/images/checkout/reviews/review1.png",
    isVerified: true,
  },
  {
    content:
      "Feedbird creates social media content that is better and less expensive than what we can do in-house. The process is smooth and helped reduce our monthly time spent on content from 8 hours to 15 minutes.",
    authorName: "Scott Regan",
    authorPhoto: "/images/checkout/reviews/review1.png",
    isVerified: true,
  },
  {
    content:
      "Feedbird creates social media content that is better and less expensive than what we can do in-house. The process is smooth and helped reduce our monthly time spent on content from 8 hours to 15 minutes.",
    authorName: "Scott Regan",
    authorPhoto: "/images/checkout/reviews/review1.png",
    isVerified: true,
  },
];

export default function ReviewsCarousel({
  autoSlide,
  interval = 5000,
}: ReviewsCarouselProps) {
  const [slide, setSlide] = React.useState(0);

  React.useEffect(() => {
    if (!autoSlide) return;
    const slideInterval = setInterval(() => {
      setSlide((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
    }, interval);

    return () => clearInterval(slideInterval);
  }, [autoSlide, interval]);

  return (
    <div className="h-full mx-6 mt-8 overflow-hidden flex flex-col items-center gap-8">
      <div
        className="flex flex-row transition-transform duration-500 ease-in-out "
        style={{ transform: `translateX(-${slide * 100}%)` }}
      >
        {reviews.map((review, index) => (
          <div
            key={index}
            className="flex flex-col gap-[18px] text-center w-full flex-shrink-0"
          >
            <p className="font-medium text-black text-lg">“{review.content}”</p>
            <div className="flex items-center justify-center">
              <div className="flex flex-row gap-2 items-center">
                <Image
                  src={review.authorPhoto}
                  alt={`Review_${review.authorName}_image`}
                  className="aspect-square w-8 h-8"
                  width={32}
                  height={32}
                />
                <div className="flex flex-col">
                  <div className="flex gap-1">
                    <span className="text-black text-sm font-medium">
                      {review.authorName}
                    </span>
                    {review.isVerified && (
                      <Image
                        src="/images/checkout/check.svg"
                        alt="VerifiedIcon"
                        width={16}
                        height={16}
                      />
                    )}
                  </div>
                  {review.isVerified && (
                    <p className="text-[#5C5E63] font-normal text-sm">
                      Verified Review
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-row gap-2">
        {reviews.map((_, index) => (
          <div
            key={`indicator_${index}`}
            className={`rounded-full w-[67px] h-1 ${
              index === slide ? "bg-[#4670F9]" : "bg-[#D3D3D3]"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
}
