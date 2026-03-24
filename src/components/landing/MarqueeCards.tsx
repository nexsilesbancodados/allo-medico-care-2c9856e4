import card01 from "@/assets/marquee/card-01.jpg";
import card02 from "@/assets/marquee/card-02.jpg";
import card03 from "@/assets/marquee/card-03.jpg";
import card04 from "@/assets/marquee/card-04.jpg";
import card05 from "@/assets/marquee/card-05.jpg";
import card06 from "@/assets/marquee/card-06.jpg";
import card07 from "@/assets/marquee/card-07.jpg";
import card08 from "@/assets/marquee/card-08.jpg";
import card09 from "@/assets/marquee/card-09.jpg";
import card10 from "@/assets/marquee/card-10.jpg";
import card11 from "@/assets/marquee/card-11.jpg";
import card12 from "@/assets/marquee/card-12.jpg";
import card13 from "@/assets/marquee/card-13.jpg";
import card14 from "@/assets/marquee/card-14.jpg";
import card15 from "@/assets/marquee/card-15.jpg";
import card16 from "@/assets/marquee/card-16.jpg";

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
