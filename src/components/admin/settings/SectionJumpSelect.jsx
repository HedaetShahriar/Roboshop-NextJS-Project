'use client';

export default function SectionJumpSelect({ ids = [], className = '' }) {
  function handleChange(e) {
    const id = e.target.value;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground block mb-1">Jump to</label>
      <select className="w-full border rounded px-2 py-2 text-sm" onChange={handleChange}>
        {ids.map((id) => (
          <option key={id} value={id}>{id[0].toUpperCase() + id.slice(1).replace(/-/g,' ')}</option>
        ))}
      </select>
    </div>
  );
}
