// Placeholder rendered when a server section fails to load.
// Currently unused — page.tsx silently drops null sections.
// Wire it in if you want a visible "failed to load" state per rail.
export function SectionError({ title }: { title?: string }) {
  return (
    <div className="flex h-10 items-center px-4 text-xs text-text-mute">
      {title ? `«${title}» недоступен` : "Секция недоступна"}
    </div>
  );
}
