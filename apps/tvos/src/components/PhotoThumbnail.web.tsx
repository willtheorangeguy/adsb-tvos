export function PhotoThumbnail({
  url,
  link,
  credit,
  onError,
}: {
  url: string;
  link: string;
  credit: string;
  onError: () => void;
}) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open photo on Planespotters.net · ${credit}`}
      style={{display: 'block', marginTop: 24}}>
      <img
        src={url}
        alt={`Selected aircraft · ${credit}`}
        onError={onError}
        style={{
          display: 'block',
          width: '100%',
          height: 190,
          objectFit: 'contain',
          borderRadius: 14,
          background: '#090f17',
        }}
      />
    </a>
  );
}
