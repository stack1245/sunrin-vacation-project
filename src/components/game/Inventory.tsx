"use client";

import { useGameStore } from "@/store/useGameStore";

export function Inventory() {
  const inventory = useGameStore((state) => state.inventory);

  return (
    <section aria-labelledby="inventory-title">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="eyebrow">Recovered objects</p>
          <h2 id="inventory-title" className="mt-1 font-serif text-xl text-slate-100">
            인벤토리
          </h2>
        </div>
        <span className="text-xs text-slate-500">{inventory.length}/6</span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => {
          const item = inventory[index];

          return (
            <button
              key={item?.id ?? `empty-${index}`}
              type="button"
              disabled={!item}
              className="aspect-square rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-2 text-center transition enabled:border-amber-200/30 enabled:bg-amber-200/5 enabled:hover:-translate-y-0.5 disabled:cursor-default"
              aria-label={item ? `아이템: ${item.name}` : `빈 슬롯 ${index + 1}`}
            >
              {item ? (
                <>
                  <span className="block text-2xl">{item.icon}</span>
                  <span className="mt-1 block truncate text-xs text-slate-300">
                    {item.name}
                  </span>
                </>
              ) : (
                <span className="text-sm text-slate-700">{index + 1}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
