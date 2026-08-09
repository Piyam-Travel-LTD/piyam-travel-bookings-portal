import React, { useEffect, useMemo, useState } from 'react';

export const PERSONAL_CHECKLIST_ITEMS = Object.freeze([
  { id: 'passport', label: 'Passport and required travel documents packed' },
  { id: 'downloads', label: 'Tickets and vouchers downloaded for offline access' },
  { id: 'medication', label: 'Medication and essential items packed' },
  { id: 'connectivity', label: 'Roaming, local SIM or E-Sim arrangements checked' },
  { id: 'transport', label: 'Arrival and transport details reviewed' },
  { id: 'emergency', label: 'Piyam Travel emergency number saved' }
]);

export function personalChecklistStorageKey(reference) {
  const safeReference = String(reference || 'package').replace(/[^A-Za-z0-9-]/g, '').slice(0, 80);
  return `piyam-personal-checklist:${safeReference || 'package'}`;
}

function readStoredChecklist(storageKey) {
  if (typeof window === 'undefined') return { completed: {}, customItems: [] };

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(storageKey) || '{}');
    const completed = parsed?.completed && typeof parsed.completed === 'object' && !Array.isArray(parsed.completed)
      ? Object.fromEntries(Object.entries(parsed.completed).filter(([, value]) => typeof value === 'boolean'))
      : {};
    const customItems = Array.isArray(parsed?.customItems)
      ? parsed.customItems
        .slice(0, 20)
        .filter((item) => item && typeof item.id === 'string' && typeof item.label === 'string')
        .map((item) => ({ id: item.id.slice(0, 100), label: item.label.trim().slice(0, 120) }))
        .filter((item) => item.id && item.label)
      : [];
    return { completed, customItems };
  } catch (_error) {
    return { completed: {}, customItems: [] };
  }
}

export default function PersonalTravelChecklist({ reference }) {
  const storageKey = useMemo(() => personalChecklistStorageKey(reference), [reference]);
  const [state, setState] = useState(() => ({ storageKey, ...readStoredChecklist(storageKey) }));
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    setState({ storageKey, ...readStoredChecklist(storageKey) });
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || state.storageKey !== storageKey) return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({
        completed: state.completed,
        customItems: state.customItems
      }));
    } catch (_error) {
      // Checklist remains usable in memory when browser storage is unavailable.
    }
  }, [state, storageKey]);

  const allItems = [
    ...PERSONAL_CHECKLIST_ITEMS,
    ...state.customItems.map((item) => ({ ...item, custom: true }))
  ];
  const completedCount = allItems.filter((item) => state.completed[item.id] === true).length;

  const toggleItem = (itemId) => {
    setState((current) => ({
      ...current,
      completed: {
        ...current.completed,
        [itemId]: current.completed[itemId] !== true
      }
    }));
  };

  const addItem = (event) => {
    event.preventDefault();
    const label = newItem.trim().slice(0, 120);
    if (!label || state.customItems.length >= 20) return;
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setState((current) => ({ ...current, customItems: [...current.customItems, { id, label }] }));
    setNewItem('');
  };

  const removeItem = (itemId) => {
    setState((current) => {
      const completed = { ...current.completed };
      delete completed[itemId];
      return {
        ...current,
        completed,
        customItems: current.customItems.filter((item) => item.id !== itemId)
      };
    });
  };

  const resetChecklist = () => setState((current) => ({ ...current, completed: {}, customItems: [] }));

  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30" aria-labelledby="personal-checklist-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="personal-checklist-heading" className="font-bold text-gray-800 dark:text-gray-100">My personal checklist</h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            Private to this browser tab. It is not sent to Piyam Travel or added to your booking.
          </p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-emerald-800 dark:text-emerald-200" aria-live="polite">
          {completedCount} of {allItems.length} complete
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {allItems.map((item) => (
          <li key={item.id} className="flex items-start gap-2 rounded-md bg-white p-3 dark:bg-gray-800">
            <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={state.completed[item.id] === true}
                onChange={() => toggleItem(item.id)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span className={`break-words text-sm ${state.completed[item.id] ? 'text-gray-500 line-through dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                {item.label}
              </span>
            </label>
            {item.custom && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-300 dark:hover:bg-gray-700"
                aria-label={`Remove ${item.label}`}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={addItem} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="personal-checklist-item" className="sr-only">Add a personal checklist item</label>
        <input
          id="personal-checklist-item"
          type="text"
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          maxLength={120}
          placeholder="Add your own reminder"
          className="min-h-10 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        />
        <button
          type="submit"
          disabled={!newItem.trim() || state.customItems.length >= 20}
          className="min-h-10 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add reminder
        </button>
      </form>

      {(completedCount > 0 || state.customItems.length > 0) && (
        <button type="button" onClick={resetChecklist} className="mt-3 text-xs font-semibold text-gray-600 underline hover:text-gray-900 dark:text-gray-300">
          Reset my checklist
        </button>
      )}
    </section>
  );
}
