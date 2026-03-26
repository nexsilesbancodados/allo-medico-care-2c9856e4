import card01 from "@/assets/marquee/card-01.webp";
import card02 from "@/assets/marquee/card-02.webp";
import card03 from "@/assets/marquee/card-03.webp";
import card04 from "@/assets/marquee/card-04.webp";
import card05 from "@/assets/marquee/card-05.webp";
import card06 from "@/assets/marquee/card-06.webp";
import card07 from "@/assets/marquee/card-07.webp";
import card08 from "@/assets/marquee/card-08.webp";
import card09 from "@/assets/marquee/card-09.webp";
import card10 from "@/assets/marquee/card-10.webp";
import card11 from "@/assets/marquee/card-11.webp";
import card12 from "@/assets/marquee/card-12.webp";
import card13 from "@/assets/marquee/card-13.webp";
import card14 from "@/assets/marquee/card-14.webp";
import card15 from "@/assets/marquee/card-15.webp";
import card16 from "@/assets/marquee/card-16.webp";

const rowRight = [card01, card02, card03, card04, card05, card06, card07, card08];
const rowLeft = [card09, card10, card11, card12, card13, card14, card15, card16];

function MarqueeRow({ images, direction }: { images: string[]; direction: "left" | "right" }) {
  const doubled = [...images, ...images];
  return (
    <div className="overflow-hidden">
      <div
        className={`flex gap-4 w-max ${direction === "right" ? "animate-marquee-right" : "animate-marquee-left"}`}
      >
        {doubled.map((src, i) => (
          <div
            key={i}
            className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-2xl overflow-hidden shrink-0 shadow-md"
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              width={176}
              height={176}
              className="w-full h-full object-cover" decoding="async" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarqueeCards() {
  return (
    <section className="py-10 space-y-4 overflow-hidden">
      <MarqueeRow images={rowRight} direction="right" />
      <MarqueeRow images={rowLeft} direction="left" />
    </section>
  );
}
