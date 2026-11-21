"use client";import{useEffect}from"react";const variants={primary:"bg-ink text-paper hover:bg-ink/90",gold:"bg-gold text-white hover:bg-gold-dark",secondary:"bg-white text-ink ring-1 ring-ink/15 hover:ring-ink/30",ghost:"text-ink/70 hover:text-ink hover:bg-ink/5"};export function Button({variant="primary",className="",loading,children,...rest}){return<button{...rest}disabled={rest.disabled||loading}className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}>
      {loading&&<Spinner/>}
      {children}
    </button>}export function Spinner({className=""}){return<span className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}/>}export function Badge({children,tone="neutral"}){const t={neutral:"bg-ink/5 text-ink/70",gold:"bg-gold/15 text-gold-dark",warn:"bg-amber-100 text-amber-800",ok:"bg-emerald-100 text-emerald-800"}[tone];return<span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${t}`}>{children}</span>}export function Card({children,className=""}){return<div className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink/5 sm:p-5 ${className}`}>{children}</div>}export function Sheet({open,onClose,title,children,footer}){return useEffect(()=>{if(!open)return;const onKey=e=>e.key==="Escape"&&onClose();window.addEventListener("keydown",onKey);const prev=document.body.style.overflow;return document.body.style.overflow="hidden",()=>{window.removeEventListener("keydown",onKey),document.body.style.overflow=prev}},[open,onClose]),open?<div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"role="dialog"aria-modal="true">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"onClick={onClose}/>
      <div className="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-paper shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-ink/15 sm:hidden"/>
        <div className="flex items-center justify-between gap-4 px-5 pb-2 pt-3 sm:pt-5">
          <h2 className="font-display text-xl">{title}</h2>
          <button onClick={onClose}className="rounded-full p-2 text-ink/60 hover:bg-ink/5"aria-label="Close">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer&&<div className="border-t border-ink/10 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>:null}export function Field({label,hint,children,aside}){return<label className="block">
      <span className="mb-1 flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-ink/60">
        <span>{label}</span>
        {aside}
      </span>
      {children}
      {hint&&<span className="mt-1 block text-xs text-ink/50">{hint}</span>}
    </label>}export const inputCls="w-full rounded-xl border-0 bg-white px-3 py-2.5 text-[15px] text-ink shadow-sm ring-1 ring-ink/10 placeholder:text-ink/30 focus:ring-2 focus:ring-gold focus:outline-none";
