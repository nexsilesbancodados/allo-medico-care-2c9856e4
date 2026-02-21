import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LazyAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  fallbackClassName?: string;
}

const LazyAvatar = ({ src, name, className, fallbackClassName }: LazyAvatarProps) => {
  const [loaded, setLoaded] = useState(false);
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <Avatar className={className}>
      {src && (
        <AvatarImage
          src={src}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            "transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      <AvatarFallback className={cn("text-xs font-semibold", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default LazyAvatar;
