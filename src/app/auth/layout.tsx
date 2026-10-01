import Image from "next/image";
import { photoUrl } from "@/lib/data/photos";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex items-start justify-center px-4 py-10 sm:px-8 lg:items-center lg:py-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <Image src={photoUrl("overwaterInterior")} alt="View of a turquoise lagoon from an overwater villa" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <blockquote className="absolute inset-x-10 bottom-10 text-white">
          <p className="font-display text-3xl leading-snug">“The best trips begin long before you leave — with a little inspiration and a lot less hassle.”</p>
          <footer className="mt-3 text-sm text-white/80">The Oriel concierge team</footer>
        </blockquote>
      </div>
    </div>
  );
}
