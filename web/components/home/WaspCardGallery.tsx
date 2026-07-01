"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

type CardSide = "front" | "back";

const CARDS: Array<{
  side: CardSide;
  src: string;
  width: number;
  height: number;
}> = [
  { side: "front", src: "/images/card-front.png", width: 140, height: 245 },
  { side: "back", src: "/images/card-back.png", width: 140, height: 244 },
];

export default function WaspCardGallery() {
  const t = useTranslations("Hero.cardGallery");
  const [openSide, setOpenSide] = useState<CardSide | null>(null);
  const openCard = CARDS.find((card) => card.side === openSide) ?? null;

  return (
    <>
      <div className="flex items-start justify-center gap-4">
        {CARDS.map((card) => (
          <button
            key={card.side}
            type="button"
            onClick={() => setOpenSide(card.side)}
            className="overflow-hidden rounded-lg border border-wasp-yellow/40"
          >
            <Image
              src={card.src}
              alt={t(card.side === "front" ? "frontAlt" : "backAlt")}
              width={card.width}
              height={card.height}
            />
          </button>
        ))}
      </div>

      {openCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setOpenSide(null)}
        >
          <button
            type="button"
            onClick={() => setOpenSide(null)}
            aria-label={t("closeLabel")}
            className="absolute right-4 top-4 text-3xl leading-none text-wasp-yellow"
          >
            &times;
          </button>
          <Image
            src={openCard.src}
            alt={t(openCard.side === "front" ? "frontAlt" : "backAlt")}
            width={openCard.width * 4}
            height={openCard.height * 4}
            className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
