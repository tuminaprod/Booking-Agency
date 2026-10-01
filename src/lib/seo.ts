import type { Metadata } from "next";
import type { Destination, Experience, Hotel, Review, TravelGuide, Trip } from "@/lib/models";

export const SITE = {
  name: "Oriel",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://oriel.example",
  description: "Book considered luxury hotels, curated multi-day trips and unforgettable travel experiences worldwide — with the total price shown upfront.",
};

const ogImage = (src: string) => `${src}?auto=format&fit=crop&w=1200&h=630&q=75`;

export function buildMetadata({ title, description, path, image, noIndex }: { title: string; description: string; path: string; image?: string; noIndex?: boolean }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE.name,
      type: "website",
      images: image ? [{ url: ogImage(image), width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [ogImage(image)] : undefined },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

const abs = (path: string) => new URL(path, SITE.url).toString();

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: SITE.name,
    url: SITE.url,
    logo: abs("/icon.svg"),
    description: SITE.description,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

const reviewLd = (r: Review) => ({
  "@type": "Review",
  author: { "@type": "Person", name: r.author },
  datePublished: r.date,
  name: r.title,
  reviewBody: r.body,
  reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 10, worstRating: 1 },
});

export function hotelJsonLd(hotel: Hotel, destination: Destination, reviews: Review[], priceFrom: number) {
  return {
    "@context": "https://schema.org",
    "@type": hotel.propertyType === "resort" ? "Resort" : "Hotel",
    name: hotel.name,
    description: hotel.shortDescription,
    url: abs(`/hotels/${hotel.slug}`),
    image: hotel.images.slice(0, 5).map((i) => i.src),
    starRating: { "@type": "Rating", ratingValue: hotel.stars },
    address: { "@type": "PostalAddress", streetAddress: hotel.address, addressLocality: destination.name, addressCountry: destination.country },
    geo: { "@type": "GeoCoordinates", latitude: hotel.coordinates.lat, longitude: hotel.coordinates.lng },
    telephone: hotel.contact.phone,
    checkinTime: hotel.policies.checkIn,
    checkoutTime: hotel.policies.checkOut,
    priceRange: `From $${priceFrom} per night`,
    amenityFeature: hotel.amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a, value: true })),
    aggregateRating: { "@type": "AggregateRating", ratingValue: hotel.rating, bestRating: 10, reviewCount: hotel.reviewCount },
    review: reviews.slice(0, 3).map(reviewLd),
  };
}

export function tripJsonLd(trip: Trip) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: trip.title,
    description: trip.summary,
    url: abs(`/trips/${trip.slug}`),
    image: trip.images.map((i) => i.src),
    itinerary: {
      "@type": "ItemList",
      itemListElement: trip.days.map((d) => ({ "@type": "ListItem", position: d.day, name: `Day ${d.day}: ${d.title}`, description: d.description })),
    },
    offers: { "@type": "Offer", price: trip.priceFrom, priceCurrency: "USD", availability: "https://schema.org/InStock", url: abs(`/trips/${trip.slug}`) },
    aggregateRating: { "@type": "AggregateRating", ratingValue: trip.rating, bestRating: 10, reviewCount: trip.reviewCount },
  };
}

export function experienceJsonLd(exp: Experience, destination: Destination) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: exp.title,
    description: exp.summary,
    image: exp.images.map((i) => i.src),
    category: exp.category,
    brand: { "@type": "Brand", name: SITE.name },
    areaServed: destination.name,
    offers: { "@type": "Offer", price: exp.priceFrom, priceCurrency: "USD", availability: "https://schema.org/InStock", url: abs(`/experiences/${exp.slug}`) },
    aggregateRating: { "@type": "AggregateRating", ratingValue: exp.rating, bestRating: 10, reviewCount: exp.reviewCount },
  };
}

export function destinationJsonLd(d: Destination) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: d.name,
    description: d.tagline,
    url: abs(`/destinations/${d.slug}`),
    image: d.heroImage.src,
    geo: { "@type": "GeoCoordinates", latitude: d.coordinates.lat, longitude: d.coordinates.lng },
    containedInPlace: { "@type": "Country", name: d.country },
    includesAttraction: d.attractions.map((a) => ({ "@type": "TouristAttraction", name: a.name, description: a.description })),
  };
}

export function articleJsonLd(g: TravelGuide) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.excerpt,
    image: g.heroImage.src,
    datePublished: g.publishedAt,
    dateModified: g.updatedAt ?? g.publishedAt,
    author: { "@type": "Person", name: g.author.name, jobTitle: g.author.role },
    publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: abs("/icon.svg") } },
    mainEntityOfPage: abs(`/guides/${g.slug}`),
  };
}
