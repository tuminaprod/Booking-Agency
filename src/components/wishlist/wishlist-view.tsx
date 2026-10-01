"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Check, FolderPlus, GitCompareArrows, Heart, History, MoreHorizontal, Pencil, Share2, Trash2, X } from "lucide-react";
import type { SavableType } from "@/lib/models";
import { cn } from "@/lib/cn";
import { AMENITIES } from "@/lib/data/catalog";
import type { AmenityId } from "@/lib/models";
import { recentStore, wishlist, wishlistStore, type SavedItem, type SavedSnapshot } from "@/lib/stores";
import { useHydrated } from "@/lib/stores/create-store";
import { Button, ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { Money } from "@/components/ui/money";
import { Popover } from "@/components/ui/popover";
import { RatingBadge, Stars } from "@/components/ui/rating";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";

const TYPE_TABS: { id: "all" | SavableType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "hotel", label: "Hotels" },
  { id: "destination", label: "Destinations" },
  { id: "trip", label: "Trips" },
  { id: "experience", label: "Experiences" },
];

function SnapshotCard({ snapshot, children, badge }: { snapshot: SavedSnapshot; children?: React.ReactNode; badge?: string }) {
  return (
    <article className="group relative flex h-full flex-col rounded-lg border border-line bg-surface transition-shadow hover:shadow-card">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-sand">
        <Image src={snapshot.image.src} alt={snapshot.image.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        {badge && <span className="absolute left-3 top-3 rounded-sm bg-white/95 px-2 py-0.5 text-xs font-semibold text-ink shadow-soft">{badge}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug text-ink">
          <Link href={snapshot.href} className="after:absolute after:inset-0 after:content-['']">
            {snapshot.title}
          </Link>
        </h3>
        <p className="mt-0.5 text-sm text-muted">{snapshot.subtitle}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          {snapshot.rating ? <RatingBadge rating={snapshot.rating} size="sm" showLabel={false} /> : <span />}
          {snapshot.priceFrom ? (
            <p className="text-sm text-muted">
              From <span className="font-semibold text-ink"><Money usd={snapshot.priceFrom} /></span>
              {snapshot.priceUnit && ` / ${snapshot.priceUnit}`}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </article>
  );
}

const TYPE_LABEL: Record<SavableType, string> = { hotel: "Hotel", destination: "Destination", trip: "Trip", experience: "Experience" };

export function WishlistView() {
  const hydrated = useHydrated();
  const items = wishlistStore.use((s) => s.items);
  const collections = wishlistStore.use((s) => s.collections);
  const compare = wishlistStore.use((s) => s.compare);
  const recent = recentStore.use((s) => s.items);
  const toast = useToast();
  const [tab, setTab] = useState<"all" | SavableType>("all");
  const [collection, setCollection] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState<{ forItem?: string } | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [compareOpen, setCompareOpen] = useState(false);

  const visible = useMemo(() => items.filter((i) => (tab === "all" || i.type === tab) && (!collection || i.collectionIds.includes(collection))), [items, tab, collection]);
  const compareItems = items.filter((i) => i.type === "hotel" && compare.includes(i.entityId));

  if (!hydrated) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5]" />
        ))}
      </div>
    );
  }

  const remove = (item: SavedItem) => {
    wishlist.remove(item.id);
    toast.info("Removed from wishlist", item.snapshot.title, { label: "Undo", onClick: () => wishlist.restore(item) });
  };

  const submitCollection = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2) return setNameError("Give your collection a name of at least 2 characters");
    if (collections.some((c) => c.name.toLowerCase() === n.toLowerCase() && c.id !== renameId)) return setNameError("You already have a collection with this name");
    if (renameId) {
      wishlist.renameCollection(renameId, n);
      toast.success("Collection renamed");
    } else {
      const c = wishlist.createCollection(n);
      if (newOpen?.forItem) wishlist.toggleInCollection(newOpen.forItem, c.id);
      toast.success(`“${c.name}” created`);
    }
    setNewOpen(null);
    setRenameId(null);
    setName("");
    setNameError(undefined);
  };

  const share = async () => {
    const list = visible.map((i) => `${i.type}:${i.entityId}`).join(",");
    const title = collection ? collections.find((c) => c.id === collection)?.name : "My Oriel wishlist";
    const url = `${window.location.origin}/wishlist/shared?items=${encodeURIComponent(list)}&title=${encodeURIComponent(title ?? "")}`;
    try {
      if (navigator.share) await navigator.share({ title: title ?? "Wishlist", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied", "Anyone with the link can view these saved places.");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error("Couldn't create a share link");
    }
  };

  return (
    <div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-6" aria-hidden />}
          title="Your wishlist is empty"
          description="Tap the heart on any hotel, trip, destination or experience to save it here. Group favourites into collections and compare hotels side by side."
          action={
            <>
              <ButtonLink href="/hotels">Browse hotels</ButtonLink>
              <ButtonLink href="/destinations" variant="secondary">
                Explore destinations
              </ButtonLink>
            </>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs items={TYPE_TABS.map((t) => ({ id: t.id, label: `${t.label} (${t.id === "all" ? items.length : items.filter((i) => i.type === t.id).length})` }))} value={tab} onChange={setTab} label="Saved item types" />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="h-10" onClick={share} iconLeft={<Share2 className="size-4" aria-hidden />} disabled={!visible.length}>
                Share
              </Button>
              <Button variant="secondary" size="sm" className="h-10" onClick={() => { setName(""); setNewOpen({}); }} iconLeft={<FolderPlus className="size-4" aria-hidden />}>
                New collection
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Collections">
            <button type="button" aria-pressed={!collection} onClick={() => setCollection(null)} className={cn("inline-flex h-9 items-center rounded-md border px-3.5 text-sm font-medium", !collection ? "border-navy bg-navy text-white" : "border-line-strong bg-surface hover:border-ink/50")}>
              All saved
            </button>
            {collections.map((c) => {
              const count = items.filter((i) => i.collectionIds.includes(c.id)).length;
              const on = collection === c.id;
              return (
                <span key={c.id} className={cn("inline-flex h-9 items-center overflow-hidden rounded-md border text-sm font-medium", on ? "border-navy bg-navy text-white" : "border-line-strong bg-surface")}>
                  <button type="button" aria-pressed={on} onClick={() => setCollection(on ? null : c.id)} className="h-full px-3.5">
                    {c.name} <span className={on ? "text-white/75" : "text-muted"}>({count})</span>
                  </button>
                  {on && (
                    <>
                      <button type="button" className="inline-flex h-full items-center px-2 hover:bg-white/10" aria-label={`Rename ${c.name}`} onClick={() => { setRenameId(c.id); setName(c.name); setNewOpen({}); }}>
                        <Pencil className="size-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-full items-center px-2 hover:bg-white/10"
                        aria-label={`Delete ${c.name}`}
                        onClick={() => {
                          wishlist.deleteCollection(c.id);
                          setCollection(null);
                          toast.info(`“${c.name}” deleted`, "Saved items were kept in your wishlist.");
                        }}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </>
                  )}
                </span>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <EmptyState className="mt-6" icon={<Heart className="size-6" aria-hidden />} title="Nothing here yet" description={collection ? "Add saved items to this collection using the ••• menu on each card." : "You haven't saved anything of this type yet."} />
          ) : (
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((item) => (
                <li key={item.id}>
                  <SnapshotCard snapshot={item.snapshot} badge={TYPE_LABEL[item.type]}>
                    <div className="relative z-10 flex items-center justify-between border-t border-line px-2 py-1.5">
                      {item.type === "hotel" ? (
                        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-ink hover:bg-sand">
                          <input
                            type="checkbox"
                            className="size-4 accent-[var(--color-navy)]"
                            checked={compare.includes(item.entityId)}
                            onChange={() => {
                              const r = wishlist.toggleCompare(item.entityId);
                              if (!r.ok) toast.error("Compare limit reached", r.reason);
                            }}
                          />
                          Compare
                        </label>
                      ) : (
                        <span />
                      )}
                      <div className="flex items-center">
                        <Popover
                          id={`col-${item.id}`}
                          align="end"
                          label="Collections"
                          panelClassName="w-60 p-2"
                          trigger={({ toggle, ref, ...aria }) => (
                            <button ref={ref} type="button" onClick={toggle} {...aria} className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-sand hover:text-ink" aria-label={`Collections for ${item.snapshot.title}`}>
                              <MoreHorizontal className="size-4" aria-hidden />
                            </button>
                          )}
                        >
                          {(close) => (
                            <div>
                              <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Add to collection</p>
                              {collections.map((c) => (
                                <button key={c.id} type="button" onClick={() => wishlist.toggleInCollection(item.id, c.id)} className="flex h-10 w-full items-center justify-between rounded-md px-2 text-left text-sm hover:bg-sand" aria-pressed={item.collectionIds.includes(c.id)}>
                                  {c.name}
                                  {item.collectionIds.includes(c.id) && <Check className="size-4 text-navy" aria-hidden />}
                                </button>
                              ))}
                              <button type="button" onClick={() => { close(); setName(""); setNewOpen({ forItem: item.id }); }} className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-navy hover:bg-sand">
                                <FolderPlus className="size-4" aria-hidden /> New collection
                              </button>
                            </div>
                          )}
                        </Popover>
                        <button type="button" onClick={() => remove(item)} className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-danger-tint hover:text-danger" aria-label={`Remove ${item.snapshot.title} from wishlist`}>
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </SnapshotCard>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {recent.length > 0 && (
        <section className="mt-16" aria-labelledby="recent-title">
          <h2 id="recent-title" className="flex items-center gap-2 font-display text-3xl text-ink">
            <History className="size-6 text-muted" aria-hidden /> Recently viewed
          </h2>
          <ul className="no-scrollbar -mx-4 mt-5 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {recent.map((r) => (
              <li key={r.key} className="w-64 shrink-0">
                <SnapshotCard snapshot={r.snapshot} badge={TYPE_LABEL[r.type]} />
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => recentStore.set({ items: [] })} className="mt-3 text-sm font-medium text-navy hover:underline">
            Clear recently viewed
          </button>
        </section>
      )}

      {compareItems.length > 0 && (
        <div className="pb-safe fixed inset-x-0 bottom-16 z-30 border-t border-line bg-surface/95 shadow-raised backdrop-blur lg:bottom-0">
          <div className="container-page flex h-16 items-center justify-between gap-3">
            <p className="text-sm text-ink">
              <strong>{compareItems.length}</strong> hotel{compareItems.length > 1 ? "s" : ""} selected {compareItems.length < 2 && <span className="text-muted">— select at least 2</span>}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => wishlist.clearCompare()}>
                Clear
              </Button>
              <Button size="sm" onClick={() => setCompareOpen(true)} disabled={compareItems.length < 2} iconLeft={<GitCompareArrows className="size-4" aria-hidden />}>
                Compare
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal open={compareOpen} onClose={() => setCompareOpen(false)} title="Compare hotels" size="xl">
        <CompareTable items={compareItems} onRemove={(id) => wishlist.toggleCompare(id)} />
      </Modal>

      <Modal
        open={newOpen !== null}
        onClose={() => {
          setNewOpen(null);
          setRenameId(null);
          setNameError(undefined);
        }}
        title={renameId ? "Rename collection" : "New collection"}
        size="sm"
      >
        <form onSubmit={submitCollection} noValidate>
          <Field label="Collection name" error={nameError}>
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Honeymoon shortlist" autoFocus maxLength={60} />}
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setNewOpen(null)}>
              Cancel
            </Button>
            <Button type="submit">{renameId ? "Save" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CompareTable({ items, onRemove }: { items: SavedItem[]; onRemove: (id: string) => void }) {
  const rows: { label: string; render: (s: SavedSnapshot) => React.ReactNode }[] = [
    { label: "Stars", render: (s) => (s.stars ? <Stars count={s.stars} /> : "—") },
    { label: "Guest rating", render: (s) => (s.rating ? <RatingBadge rating={s.rating} reviews={s.reviewCount} size="sm" /> : "—") },
    { label: "From", render: (s) => (s.priceFrom ? <><Money usd={s.priceFrom} /> / night</> : "—") },
    { label: "Type", render: (s) => s.compare?.propertyType ?? "—" },
    { label: "Location", render: (s) => `${s.compare?.neighborhood ?? ""}${s.compare?.distanceKm !== undefined ? ` · ${s.compare.distanceKm} km from centre` : ""}` },
    { label: "Cancellation", render: (s) => s.compare?.cancellation ?? "—" },
    { label: "Breakfast", render: (s) => (s.compare?.breakfast ? "Included on some rooms" : "Available as extra") },
  ];
  const KEY: AmenityId[] = ["pool", "spa", "beachfront", "restaurant", "gym", "family-friendly", "airport-transfer", "parking"];
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <caption className="sr-only">Side-by-side comparison of selected hotels</caption>
        <thead>
          <tr>
            <th scope="col" className="w-36 p-3 text-left align-bottom text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Hotel
            </th>
            {items.map((i) => (
              <th key={i.id} scope="col" className="p-3 text-left align-top font-normal">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-sand">
                  <Image src={i.snapshot.image.src} alt="" fill sizes="200px" className="object-cover" />
                </div>
                <Link href={i.snapshot.href} className="mt-2 block font-semibold text-ink hover:underline">
                  {i.snapshot.title}
                </Link>
                <button type="button" onClick={() => onRemove(i.entityId)} className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-danger">
                  <X className="size-3" aria-hidden /> Remove
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-line">
              <th scope="row" className="p-3 text-left font-medium text-muted">
                {r.label}
              </th>
              {items.map((i) => (
                <td key={i.id} className="p-3 text-ink">
                  {r.render(i.snapshot)}
                </td>
              ))}
            </tr>
          ))}
          {KEY.map((a) => (
            <tr key={a} className="border-t border-line">
              <th scope="row" className="p-3 text-left font-medium text-muted">
                {AMENITIES[a].label}
              </th>
              {items.map((i) => (
                <td key={i.id} className="p-3">
                  {i.snapshot.compare?.amenities.includes(a) ? <Check className="size-4 text-success" aria-label="Yes" /> : <X className="size-4 text-line-strong" aria-label="No" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
