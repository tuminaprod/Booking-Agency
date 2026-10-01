"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ImagePlus, Plus, Star, Trash2 } from "lucide-react";
import type { AmenityId, Destination, Hotel, HotelRoom, PropertyType } from "@/lib/models";
import { cn } from "@/lib/cn";
import { AMENITIES, PROPERTY_TYPE_LABEL } from "@/lib/data/catalog";
import { addDays, todayISO } from "@/lib/dates";
import { formatDateShort } from "@/lib/format";
import { roomAvailability } from "@/lib/booking/availability";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";

type Tab = "details" | "images" | "rooms" | "pricing" | "amenities" | "policies";
const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "images", label: "Images" },
  { id: "rooms", label: "Rooms" },
  { id: "pricing", label: "Prices & availability" },
  { id: "amenities", label: "Amenities" },
  { id: "policies", label: "Policies" },
];

interface EditableImage {
  id: string;
  src: string;
  alt: string;
  local?: boolean;
}

const blankRoom = (hotelId: string, i: number): HotelRoom => ({
  id: `${hotelId}-new${i}`,
  hotelId,
  name: "New room type",
  description: "",
  images: [],
  beds: [{ type: "king", count: 1 }],
  maxAdults: 2,
  maxChildren: 0,
  sizeSqm: 30,
  amenities: [],
  breakfastIncluded: false,
  cancellation: { type: "free", freeUntilDays: 7, summary: "Free cancellation until 7 days before arrival" },
  basePrice: 200,
  inventory: 4,
});

export function HotelEditor({ hotel, destinations }: { hotel?: Hotel; destinations: Destination[] }) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !hotel;
  const id = hotel?.id ?? "htl-new";
  const [tab, setTab] = useState<Tab>("details");
  const [details, setDetails] = useState({
    name: hotel?.name ?? "",
    destinationId: hotel?.destinationId ?? "",
    propertyType: hotel?.propertyType ?? ("hotel" as PropertyType),
    stars: hotel?.stars ?? 4,
    address: hotel?.address ?? "",
    neighborhood: hotel?.neighborhood ?? "",
    shortDescription: hotel?.shortDescription ?? "",
    description: hotel?.description.join("\n\n") ?? "",
    phone: hotel?.contact.phone ?? "",
    taxRate: String(Math.round((hotel?.taxRate ?? 0.1) * 1000) / 10),
  });
  const [images, setImages] = useState<EditableImage[]>(hotel?.images.map((i) => ({ id: i.id, src: i.src, alt: i.alt })) ?? []);
  const [rooms, setRooms] = useState<HotelRoom[]>(hotel?.rooms ?? []);
  const [amenities, setAmenities] = useState<AmenityId[]>(hotel?.amenities ?? []);
  const [policies, setPolicies] = useState(hotel?.policies ?? { checkIn: "15:00", checkOut: "11:00", children: "", pets: "", smoking: "", payment: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [priceRoom, setPriceRoom] = useState(rooms[0]?.id ?? "");
  const [overrides, setOverrides] = useState<Record<string, { price?: number; closed?: boolean }>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => () => objectUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted: EditableImage[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} isn't an image`);
        continue;
      }
      if (f.size > 8 * 1024 * 1024) {
        toast.error(`${f.name} is larger than 8 MB`);
        continue;
      }
      const url = URL.createObjectURL(f);
      objectUrls.current.push(url);
      accepted.push({ id: `local-${f.name}-${f.lastModified}`, src: url, alt: f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "), local: true });
    }
    if (accepted.length) {
      setImages((im) => [...im, ...accepted]);
      toast.success(`${accepted.length} image${accepted.length > 1 ? "s" : ""} added`, "Add descriptive alt text for accessibility.");
    }
  };

  const save = async (e?: FormEvent) => {
    e?.preventDefault();
    const errs: Record<string, string> = {};
    if (details.name.trim().length < 2) errs.name = "Enter the property name";
    if (!details.destinationId) errs.destinationId = "Choose a destination";
    if (!details.address.trim()) errs.address = "Enter the street address";
    const tax = Number(details.taxRate);
    if (!Number.isFinite(tax) || tax < 0 || tax > 40) errs.taxRate = "Enter a tax rate between 0 and 40%";
    if (images.some((i) => !i.alt.trim())) errs.images = "Every image needs alt text";
    if (!rooms.length) errs.rooms = "Add at least one room type";
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      setTab(first === "images" ? "images" : first === "rooms" ? "rooms" : "details");
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success(isNew ? "Hotel created (demo)" : "Changes saved (demo)", "In production this calls the admin API and writes to the database.");
    if (isNew) router.push("/admin/hotels");
  };

  const today = todayISO();
  const selectedRoom = rooms.find((r) => r.id === priceRoom);

  return (
    <form onSubmit={save} noValidate>
      <Link href="/admin/hotels" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All hotels
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink">{isNew ? "Add hotel" : details.name}</h1>
          {!isNew && (
            <Link href={`/hotels/${hotel.slug}`} className="text-sm text-navy hover:underline" target="_blank">
              View live page ↗
            </Link>
          )}
        </div>
        <Button type="submit" loading={saving} loadingText="Saving…">
          {isNew ? "Create hotel" : "Save changes"}
        </Button>
      </div>

      <Tabs items={TABS} value={tab} onChange={setTab} label="Hotel sections" className="mt-6" idBase="hotel-editor" />
      <div className="mt-6 animate-rise-in" key={tab}>
        {tab === "details" && (
          <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
            <Field label="Property name" error={errors.name} className="sm:col-span-2">
              {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />}
            </Field>
            <Field label="Destination" error={errors.destinationId}>
              {(p) => (
                <Select id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} value={details.destinationId} onChange={(e) => setDetails({ ...details, destinationId: e.target.value })}>
                  <option value="">Select</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Property type">
              {(p) => (
                <Select id={p.id} value={details.propertyType} onChange={(e) => setDetails({ ...details, propertyType: e.target.value as PropertyType })}>
                  {Object.entries(PROPERTY_TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink">Star rating</legend>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setDetails({ ...details, stars: n as Hotel["stars"] })} aria-pressed={details.stars === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="inline-flex size-10 items-center justify-center rounded-md hover:bg-sand">
                    <Star className={cn("size-5", n <= details.stars ? "fill-gold text-gold" : "text-line-strong")} aria-hidden />
                  </button>
                ))}
              </div>
            </fieldset>
            <Field label="Tax rate (%)" error={errors.taxRate} hint="Applied to room rate and taxable extras">
              {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} inputMode="decimal" value={details.taxRate} onChange={(e) => setDetails({ ...details, taxRate: e.target.value })} />}
            </Field>
            <Field label="Street address" error={errors.address} className="sm:col-span-2">
              {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} />}
            </Field>
            <Field label="Neighbourhood">
              {(p) => <Input id={p.id} value={details.neighborhood} onChange={(e) => setDetails({ ...details, neighborhood: e.target.value })} />}
            </Field>
            <Field label="Phone">
              {(p) => <Input id={p.id} type="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />}
            </Field>
            <Field label="Short description" hint={`${details.shortDescription.length}/160 — shown on search cards`} className="sm:col-span-2">
              {(p) => <Input id={p.id} aria-describedby={p.describedBy} maxLength={160} value={details.shortDescription} onChange={(e) => setDetails({ ...details, shortDescription: e.target.value })} />}
            </Field>
            <Field label="Full description" hint="Separate paragraphs with a blank line" className="sm:col-span-2">
              {(p) => <Textarea id={p.id} aria-describedby={p.describedBy} value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} className="min-h-48" />}
            </Field>
          </div>
        )}

        {tab === "images" && (
          <div>
            {errors.images && <p role="alert" className="mb-4 text-sm font-medium text-danger">{errors.images}</p>}
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-line-strong bg-surface px-6 py-10 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFiles(e.dataTransfer.files);
              }}
            >
              <ImagePlus className="size-8 text-muted" aria-hidden />
              <p className="mt-2 font-medium text-ink">Drag photos here or</p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => fileRef.current?.click()}>
                Choose files
              </Button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} aria-label="Upload images" />
              <p className="mt-2 text-xs text-muted">JPG, PNG or WebP · up to 8 MB each · the first image is the cover</p>
            </div>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img, i) => (
                <li key={img.id} className="overflow-hidden rounded-lg border border-line bg-surface">
                  <div className="relative aspect-[4/3] bg-sand">
                    <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" unoptimized={img.local} />
                    {i === 0 && <span className="absolute left-2 top-2 rounded-sm bg-navy px-2 py-0.5 text-xs font-semibold text-white">Cover</span>}
                  </div>
                  <div className="space-y-2 p-3">
                    <label className="block text-xs font-medium text-muted">
                      Alt text
                      <Input value={img.alt} onChange={(e) => setImages((im) => im.map((x) => (x.id === img.id ? { ...x, alt: e.target.value } : x)))} invalid={!img.alt.trim()} className="mt-1 h-9 text-sm" />
                    </label>
                    <div className="flex justify-between">
                      <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => setImages((im) => [img, ...im.filter((x) => x.id !== img.id)])}>
                        Make cover
                      </Button>
                      <Button variant="ghost" size="sm" className="text-danger" onClick={() => setImages((im) => im.filter((x) => x.id !== img.id))} iconLeft={<Trash2 className="size-4" aria-hidden />}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "rooms" && (
          <div className="space-y-4">
            {errors.rooms && <p role="alert" className="text-sm font-medium text-danger">{errors.rooms}</p>}
            {rooms.map((r) => (
              <fieldset key={r.id} className="rounded-lg border border-line bg-surface p-5">
                <legend className="sr-only">{r.name}</legend>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-sm font-medium sm:col-span-2">
                    Room name
                    <Input className="mt-1" value={r.name} onChange={(e) => setRooms((rs) => rs.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))} />
                  </label>
                  <label className="text-sm font-medium">
                    Base price / night (USD)
                    <Input className="mt-1" inputMode="numeric" value={r.basePrice} onChange={(e) => setRooms((rs) => rs.map((x) => (x.id === r.id ? { ...x, basePrice: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))} />
                  </label>
                  <label className="text-sm font-medium">
                    Inventory (units)
                    <Input className="mt-1" inputMode="numeric" value={r.inventory} onChange={(e) => setRooms((rs) => rs.map((x) => (x.id === r.id ? { ...x, inventory: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))} />
                  </label>
                  <label className="text-sm font-medium">
                    Max adults
                    <Input className="mt-1" inputMode="numeric" value={r.maxAdults} onChange={(e) => setRooms((rs) => rs.map((x) => (x.id === r.id ? { ...x, maxAdults: Number(e.target.value.replace(/\D/g, "")) || 1 } : x)))} />
                  </label>
                  <label className="text-sm font-medium">
                    Size (m²)
                    <Input className="mt-1" inputMode="numeric" value={r.sizeSqm} onChange={(e) => setRooms((rs) => rs.map((x) => (x.id === r.id ? { ...x, sizeSqm: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))} />
                  </label>
                  <label className="text-sm font-medium">
                    Cancellation
                    <Select className="mt-1" value={r.cancellation.type} onChange={(e) => setRooms((rs) => rs.map((x) => (x.id === r.id ? { ...x, cancellation: { ...x.cancellation, type: e.target.value as HotelRoom["cancellation"]["type"] } } : x)))}>
                      <option value="free">Free cancellation</option>
                      <option value="partial">Partial refund</option>
                      <option value="non-refundable">Non-refundable</option>
                    </Select>
                  </label>
                  <div className="flex items-end">
                    <Checkbox label="Breakfast included" checked={r.breakfastIncluded} onChange={(e) => setRooms((rs) => rs.map((x) => (x.id === r.id ? { ...x, breakfastIncluded: e.target.checked } : x)))} />
                  </div>
                </div>
                <div className="mt-3 text-right">
                  <Button variant="ghost" size="sm" className="text-danger" onClick={() => setRooms((rs) => rs.filter((x) => x.id !== r.id))} iconLeft={<Trash2 className="size-4" aria-hidden />}>
                    Remove room type
                  </Button>
                </div>
              </fieldset>
            ))}
            <Button variant="secondary" onClick={() => setRooms((rs) => [...rs, blankRoom(id, rs.length + 1)])} iconLeft={<Plus className="size-4" aria-hidden />}>
              Add room type
            </Button>
          </div>
        )}

        {tab === "pricing" && (
          <div>
            {rooms.length === 0 ? (
              <p className="text-muted">Add a room type first.</p>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-end gap-3">
                  <label className="text-sm font-medium">
                    Room type
                    <Select className="mt-1 min-w-64" value={priceRoom} onChange={(e) => setPriceRoom(e.target.value)}>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <p className="text-sm text-muted">Next 28 nights. Edit a nightly rate or toggle a date closed. Weekend and seasonal adjustments are pre-applied.</p>
                </div>
                {selectedRoom && hotel && (
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {Array.from({ length: 28 }, (_, i) => addDays(today, i)).map((d) => {
                      const a = roomAvailability(hotel, selectedRoom, d);
                      const key = `${selectedRoom.id}:${d}`;
                      const o = overrides[key] ?? {};
                      const closed = o.closed ?? false;
                      return (
                        <li key={d} className={cn("rounded-md border p-2 text-sm", closed ? "border-danger/30 bg-danger-tint" : a.available <= 1 ? "border-warning/30 bg-warning-tint" : "border-line bg-surface")}>
                          <p className="text-xs font-semibold text-ink">{formatDateShort(d)}</p>
                          <label className="mt-1 block">
                            <span className="sr-only">Rate for {formatDateShort(d)}</span>
                            <Input className="h-8 px-2 text-sm tabular-nums" inputMode="numeric" value={o.price ?? a.price} onChange={(e) => setOverrides((x) => ({ ...x, [key]: { ...o, price: Number(e.target.value.replace(/\D/g, "")) || 0 } }))} />
                          </label>
                          <p className="mt-1 text-xs text-muted">{closed ? "Closed" : `${a.available}/${selectedRoom.inventory} left`}</p>
                          <button type="button" onClick={() => setOverrides((x) => ({ ...x, [key]: { ...o, closed: !closed } }))} className="mt-1 text-xs font-medium text-navy hover:underline" aria-pressed={closed}>
                            {closed ? "Reopen" : "Close date"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!hotel && <p className="text-muted">Availability becomes editable after the hotel is created.</p>}
              </>
            )}
          </div>
        )}

        {tab === "amenities" && (
          <div className="grid max-w-3xl gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(AMENITIES).map((a) => (
              <Checkbox key={a.id} label={a.label} checked={amenities.includes(a.id)} onChange={() => setAmenities((s) => (s.includes(a.id) ? s.filter((x) => x !== a.id) : [...s, a.id]))} />
            ))}
          </div>
        )}

        {tab === "policies" && (
          <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
            <Field label="Check-in from">
              {(p) => <Input id={p.id} type="time" value={policies.checkIn} onChange={(e) => setPolicies({ ...policies, checkIn: e.target.value })} />}
            </Field>
            <Field label="Check-out until">
              {(p) => <Input id={p.id} type="time" value={policies.checkOut} onChange={(e) => setPolicies({ ...policies, checkOut: e.target.value })} />}
            </Field>
            {(["children", "pets", "smoking", "payment"] as const).map((k) => (
              <Field key={k} label={k[0].toUpperCase() + k.slice(1)} className="sm:col-span-2">
                {(p) => <Textarea id={p.id} value={policies[k]} onChange={(e) => setPolicies({ ...policies, [k]: e.target.value })} className="min-h-20" />}
              </Field>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
