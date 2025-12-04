"use client";
import Image from "next/image";

type Props = {
  src?: string;
  alt?: string;
  priority?: boolean;
  className?: string;
};

export default function PageBackground({ src = "/img/background/banner01.jpg", alt = "Fundo", priority = true, className = "" }: Props) {
  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover w-full h-full" priority={priority} />
    </div>
  );
}
