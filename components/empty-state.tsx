import { Inbox } from "lucide-react";
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="grid min-h-44 place-items-center p-8 text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Inbox size={20}/></div><h3 className="mt-4 text-sm font-black">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">{description}</p></div></div>;
}
