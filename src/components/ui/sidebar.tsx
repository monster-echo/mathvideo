"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

type SidebarProviderProps = React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function SidebarProvider({ defaultOpen = true, open: openProp, onOpenChange, className, children, ...props }: SidebarProviderProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = openProp ?? internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [onOpenChange, openProp],
  );

  const toggleSidebar = React.useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      <div className={cn("flex h-full min-h-0 w-full", className)} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

type SidebarProps = React.ComponentProps<"aside"> & {
  collapseMode?: "icon" | "hidden";
};

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(({ className, collapseMode = "icon", ...props }, ref) => {
  const { open } = useSidebar();

  return (
    <aside
      ref={ref}
      data-state={open ? "expanded" : "collapsed"}
      data-collapse-mode={collapseMode}
      className={cn(
        "group/sidebar flex h-full shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-950",
        open ? "w-72" : collapseMode === "hidden" ? "w-0 overflow-hidden border-r-0 pointer-events-none" : "w-16",
        className,
      )}
      {...props}
    />
  );
});
Sidebar.displayName = "Sidebar";

const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentProps<"main">>(({ className, ...props }, ref) => (
  <main ref={ref} className={cn("h-full min-h-0 min-w-0 flex-1", className)} {...props} />
));
SidebarInset.displayName = "SidebarInset";

const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggleSidebar}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        className,
      )}
      {...props}
    />
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-2 border-b border-slate-200 p-2 dark:border-slate-800", className)} {...props} />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("min-h-0 flex-1 overflow-y-auto p-2", className)} {...props} />
));
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("border-t border-slate-200 p-2 dark:border-slate-800", className)} {...props} />
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("space-y-1", className)} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("list-none", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

type SidebarMenuButtonProps = React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
};

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, asChild = false, isActive = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
          isActive && "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
