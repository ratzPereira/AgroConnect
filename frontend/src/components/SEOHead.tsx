const BASE_URL = import.meta.env.VITE_BASE_URL as string | undefined ?? 'https://agroconnect.pt';

interface SEOHeadProps {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly ogImage?: string;
  readonly ogType?: string;
  readonly jsonLd?: Record<string, unknown>;
}

export function SEOHead({
  title,
  description,
  path,
  ogImage = '/pwa-512x512.png',
  ogType = 'website',
  jsonLd,
}: SEOHeadProps) {
  const url = `${BASE_URL}${path}`;
  const imageUrl = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content="pt_PT" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
