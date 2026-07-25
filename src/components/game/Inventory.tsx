"use client";

import { useGameStore } from "@/store/useGameStore";

const SLOT_COUNT = 5;

export function Inventory() {
  const inventory = useGameStore((state) => state.inventory);
  const removeItem = useGameStore((state) => state.removeItem);
  const slots = Array.from(
    { length: SLOT_COUNT },
    (_, index) => inventory[index] ?? null,
  );

  return (
    <section
      className="border border-white/10 bg-black/35 p-4 backdrop-blur-md"
      aria-labelledby="inventory-title"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="inventory-title"
          className="text-[10px] font-bold tracking-[0.22em] text-zinc-400"
        >
          INVENTORY
        </h2>
        <span className="font-mono text-[10px] text-zinc-600">
          {inventory.length}/{SLOT_COUNT}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:max-w-xl sm:gap-3">
        {slots.map((item, index) => (
          <button
            key={item?.id ?? `empty-${index}`}
            type="button"
            disabled={!item}
            onClick={() => item && removeItem(item.id)}
            className="aspect-square min-w-0 border border-white/10 bg-white/[0.025] p-1 transition enabled:hover:border-cyan-300/50 enabled:hover:bg-cyan-300/5 disabled:cursor-default"
            aria-label={
              item
                ? `${item.name} 인벤토리에서 제거`
                : `빈 인벤토리 슬롯 ${index + 1}`
            }
          >
            {item ? (
              <span className="flex h-full flex-col items-center justify-center gap-1">
                <span className="text-xl sm:text-2xl">{item.icon}</span>
                <span className="w-full truncate text-[8px] text-zinc-300 sm:text-[10px]">
                  {item.name}
                </span>
              </span>
            ) : (
              <span className="font-mono text-xs text-zinc-800">
                {String(index + 1).padStart(2, "0")}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
