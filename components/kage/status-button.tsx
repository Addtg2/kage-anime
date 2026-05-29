"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Drawer } from "vaul";
import {
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  Play,
  Plus,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Anime } from "@/lib/anime/types";
import {
  LIBRARY_STATUSES,
  useLibraryStore,
  type LibraryStatus,
} from "@/lib/store/library";
import { useHydrated } from "@/lib/store/use-hydrated";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Size = "md" | "lg";

const STATUS_META: Record<
  LibraryStatus,
  { icon: LucideIcon; desc: string; color: string }
> = {
  watching: {
    icon: Play,
    desc: "Сейчас смотрю",
    color: "text-brand",
  },
  planned: {
    icon: Bookmark,
    desc: "Посмотрю позже",
    color: "text-brand-2",
  },
  completed: {
    icon: CheckCircle2,
    desc: "Полностью просмотрено",
    color: "text-success",
  },
  dropped: {
    icon: XCircle,
    desc: "Не зашло",
    color: "text-text-dim",
  },
};

/**
 * Кнопка «В список» с дропдауном статусов.
 * - На мобиле (≤ 640px) — vaul bottom-sheet с крупными карточками.
 * - На десктопе — Portal-дропдаун со smart-flip, чтобы не обрезалось `overflow-hidden`.
 */
export function StatusButton({
  anime,
  size = "lg",
}: {
  anime: Anime;
  size?: Size;
}) {
  const hydrated = useHydrated();
  const status = useLibraryStore((s) => s.entries[anime.id]?.status ?? null);
  const setStatus = useLibraryStore((s) => s.setStatus);
  const remove = useLibraryStore((s) => s.remove);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const currentLabel =
    hydrated && status
      ? LIBRARY_STATUSES.find((s) => s.id === status)?.label
      : null;

  const inList = hydrated && !!status;

  const handleSelect = (id: LibraryStatus) => {
    setStatus(anime, id);
    setOpen(false);
  };

  const handleRemove = () => {
    remove(anime.id);
    setOpen(false);
  };

  return (
    <>
      <TriggerButton
        ref={triggerRef}
        size={size}
        inList={inList}
        label={currentLabel ?? "В список"}
        open={open}
        onClick={() => setOpen((o) => !o)}
      />

      {isMobile ? (
        <MobileSheet
          open={open}
          onOpenChange={setOpen}
          status={status}
          inList={inList}
          onSelect={handleSelect}
          onRemove={handleRemove}
        />
      ) : (
        <DesktopMenu
          triggerRef={triggerRef}
          open={open}
          onOpenChange={setOpen}
          status={status}
          inList={inList}
          onSelect={handleSelect}
          onRemove={handleRemove}
        />
      )}
    </>
  );
}

const TriggerButton = forwardRef<
  HTMLButtonElement,
  {
    size: Size;
    inList: boolean;
    label: string;
    open: boolean;
    onClick: () => void;
  }
>(function TriggerButton({ size, inList, label, open, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-haspopup="menu"
      aria-expanded={open}
      className={cn(
        buttonVariants({ variant: inList ? "primary" : "glass", size }),
      )}
    >
      {inList ? <Check /> : <Plus />}
      {label}
      <ChevronDown
        className={cn(
          "transition-transform",
          open ? "rotate-180" : "rotate-0",
        )}
      />
    </button>
  );
});

function StatusRow({
  id,
  active,
  onSelect,
  mobile,
}: {
  id: LibraryStatus;
  active: boolean;
  onSelect: (id: LibraryStatus) => void;
  mobile?: boolean;
}) {
  const meta = STATUS_META[id];
  const label = LIBRARY_STATUSES.find((s) => s.id === id)?.label ?? id;
  const Icon = meta.icon;
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onSelect(id)}
      className={cn(
        "group flex w-full items-center gap-3 text-left transition-colors",
        mobile
          ? "rounded-xl border bg-surface px-4 py-3.5"
          : "px-3 py-2.5 hover:bg-surface active:bg-surface",
        mobile && active
          ? "border-brand bg-brand/10"
          : mobile
            ? "border-border"
            : "",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border",
          active
            ? "border-transparent bg-brand text-white"
            : cn("border-border bg-surface-2", meta.color),
        )}
      >
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "text-sm font-medium",
            active ? "text-foreground" : "text-foreground",
          )}
        >
          {label}
        </span>
        <span className="text-[11px] leading-snug text-text-dim">
          {meta.desc}
        </span>
      </span>
      {active && <Check className="size-4 shrink-0 text-brand" />}
    </button>
  );
}

function MobileSheet({
  open,
  onOpenChange,
  status,
  inList,
  onSelect,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  status: LibraryStatus | null;
  inList: boolean;
  onSelect: (id: LibraryStatus) => void;
  onRemove: () => void;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
        <Drawer.Content
          aria-label="Статус в списке"
          className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[88vh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-bg-elev shadow-2xl shadow-black/60 outline-none"
        >
          <Drawer.Title className="sr-only">Выберите статус</Drawer.Title>
          <Drawer.Description className="sr-only">
            Добавить тайтл в список с одним из четырёх статусов
          </Drawer.Description>
          <div
            aria-hidden
            className="mx-auto mt-2 mb-1 h-1.5 w-10 rounded-full bg-border"
          />
          <div className="px-5 pt-2 pb-1">
            <h3 className="font-display text-xl text-foreground">Мой статус</h3>
            <p className="mt-0.5 text-[12px] text-text-dim">
              Выберите, как добавить тайтл в библиотеку
            </p>
          </div>
          <div
            className="flex flex-col gap-2 px-4 pb-4 pt-3"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
          >
            {LIBRARY_STATUSES.map((s) => (
              <StatusRow
                key={s.id}
                id={s.id}
                active={status === s.id}
                onSelect={onSelect}
                mobile
              />
            ))}
            {inList && (
              <button
                type="button"
                onClick={onRemove}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-dim transition-colors hover:border-brand hover:text-brand active:bg-surface-2"
              >
                <Trash2 className="size-4" />
                Убрать из списка
              </button>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function DesktopMenu({
  triggerRef,
  open,
  onOpenChange,
  status,
  inList,
  onSelect,
  onRemove,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  status: LibraryStatus | null;
  inList: boolean;
  onSelect: (id: LibraryStatus) => void;
  onRemove: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;
    const measure = () => {
      const rr = trigger.getBoundingClientRect();
      const menuWidth = Math.max(260, rr.width);
      const spaceBelow = window.innerHeight - rr.bottom;
      const estimatedMenuHeight = 360;
      const openUp = spaceBelow < estimatedMenuHeight && rr.top > estimatedMenuHeight;
      let left = rr.right - menuWidth;
      if (left < 8) left = 8;
      if (openUp) {
        setPos({ bottom: window.innerHeight - rr.top + 8, left, width: menuWidth });
      } else {
        setPos({ top: rr.bottom + 8, left, width: menuWidth });
      }
    };
    measure();
    const onScroll = () => measure();
    const onResize = () => measure();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange, triggerRef]);

  const menu = open && pos ? (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: "fixed",
        top: pos.top,
        bottom: pos.bottom,
        left: pos.left,
        minWidth: pos.width,
        zIndex: 80,
      }}
      className="overflow-hidden rounded-2xl border border-border bg-bg-elev p-1 shadow-2xl shadow-black/60"
    >
      {LIBRARY_STATUSES.map((s) => (
        <StatusRow
          key={s.id}
          id={s.id}
          active={status === s.id}
          onSelect={onSelect}
        />
      ))}
      {inList && (
        <>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={onRemove}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-text-dim transition-colors hover:bg-surface hover:text-foreground active:bg-surface"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2">
              <Trash2 className="size-4" />
            </span>
            Убрать из списка
          </button>
        </>
      )}
    </div>
  ) : null;

  return typeof document !== "undefined" && menu
    ? createPortal(menu, document.body)
    : null;
}
