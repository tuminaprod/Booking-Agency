import Image from "next/image";
import { Compass } from "lucide-react";
import { photoUrl } from "@/lib/data/photos";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">This path leads nowhere — yet.</h1>
        <p className="mt-4 max-w-md text-lg text-muted">The page you&apos;re looking for has moved or never existed. Let&apos;s get you back on course.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/" iconLeft={<Compass className="size-4" aria-hidden />}>
            Back to home
          </ButtonLink>
          <ButtonLink href="/destinations" variant="secondary">
            Explore destinations
          </ButtonLink>
        </div>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand">
        <Image src={photoUrl("desertRoad")} alt="An empty road winding through red rock desert" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
    </div>
  );
}
