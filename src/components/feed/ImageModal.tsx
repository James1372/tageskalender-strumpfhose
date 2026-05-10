export function ImageModal({ date, onClose, onNavigate }: {
  date: string
  onClose: () => void
  onNavigate: (date: string) => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}>
      <p className="text-white">Modal für {date} — coming in Task 13</p>
    </div>
  )
}
