// components/AppTopBar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu as MenuIcon,
  X,
  ChevronRight,
  UserCircle2,
  LogOut,
  User2,
  LogIn,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const TOPBAR_H = 56; // altura fixa da barra
const TEXT_MAIN = "text-neutral-800";

function useRouteContext() {
  const pathname = usePathname() || "/";
  const segs = pathname.split("/").filter(Boolean);
  const isCourseCtx = segs[0] === "c";
  const courseSlug = isCourseCtx ? segs[1] : undefined;
  const moduleSlug = isCourseCtx ? segs[2] : undefined;
  const unitSlug = isCourseCtx ? segs[3] : undefined;
  return { pathname, courseSlug, moduleSlug, unitSlug };
}

export default function AppTopBar() {
  const { pathname, courseSlug, moduleSlug } = useRouteContext();
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const role = (session?.user as any)?.role as
    | "ADMIN"
    | "STAFF"
    | "USER"
    | undefined;

  const [navOpen, setNavOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const closeAll = () => {
    setNavOpen(false);
    setUserOpen(false);
  };

  // Fecha menus ao trocar de rota
  useEffect(() => {
    closeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Clique fora do menu do usuário
  const userMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    if (userOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userOpen]);

  // Links do drawer (apenas quando autenticado)
  const links = useMemo(() => {
    if (!authed) return [];
    const arr: { label: string; href?: string; disabled?: boolean }[] = [
      { label: "Projetos", href: "/cursos" },
      {
        label: "Módulos",
        href: courseSlug ? `/c/${courseSlug}` : undefined,
        disabled: !courseSlug,
      },
      {
        label: "Unidades",
        href:
          courseSlug && moduleSlug
            ? `/c/${courseSlug}/${moduleSlug}`
            : undefined,
        disabled: !(courseSlug && moduleSlug),
      },
    ];
    // Itens administrativos só para ADMIN/STAFF
    if (role === "ADMIN" || role === "STAFF") {
      arr.push({ label: "Cadastrar Módulos", href: "/admin/modules/new" });
      arr.push({ label: "Cadastrar Unidades", href: "/admin/units/new" });
    }
    return arr;
  }, [authed, role, courseSlug, moduleSlug]);

  // Link de login com retorno à rota atual
  const loginHref = `/login?callback=${encodeURIComponent(pathname || "/")}`;

  // Bloco de marca (logo + texto), reaproveitado em versão link e versão "estática"
  const Brand = (
    <>
      <Image
        // garanta que exista um arquivo /public/8bits_logo.png neste projeto
        src="/8bits_logo.png"
        alt="Logo 8bits"
        width={32}
        height={32}
        className="block h-8 w-auto -translate-y-[2px]"
        priority
      />
      <span className={`text-[17px] md:text-[18px] font-semibold ${TEXT_MAIN}`}>
        8bits Educação
      </span>
    </>
  );

  return (
    <>
      {/* Topbar */}
      <header
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-3 md:px-4 
        bg-neutral-100/50 backdrop-blur-md shadow-sm ${TEXT_MAIN}`}
        style={{ height: TOPBAR_H }}
      >
        {/* Esquerda: hambúrguer (apenas autenticado) + logo/título */}
        <div className="flex items-center gap-4">
          {authed && (
            <button
              onClick={() => {
                setNavOpen((v) => !v);
                setUserOpen(false);
              }}
              aria-label="Abrir menu"
              className="grid place-items-center h-9 w-9 rounded-full hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-300 active:bg-neutral-300 active:scale-[0.98] transition cursor-pointer"
              title="Menu"
            >
              <MenuIcon size={20} className={TEXT_MAIN} />
            </button>
          )}

          {authed ? (
            // Autenticado: logo + título são atalho para /cursos
            <Link
              href="/cursos"
              className="flex items-center gap-3 select-none cursor-pointer"
            >
              {Brand}
            </Link>
          ) : (
            // Não autenticado: só mostra marca, sem link inútil
            <div className="flex items-center gap-3 select-none cursor-default">
              {Brand}
            </div>
          )}
        </div>

        {/* placeholder central (se quiser título de contexto depois) */}
        <div className="hidden md:block text-sm font-semibold opacity-80" />

        {/* Direita: menu do usuário (autenticado) ou CTA Entrar (deslogado) */}
        <div className="relative" ref={userMenuRef}>
          {authed ? (
            <>
              <button
                onClick={() => {
                  setUserOpen((v) => !v);
                  setNavOpen(false);
                }}
                aria-label="Abrir opções do usuário"
                className="grid place-items-center h-9 w-9 rounded-full hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-300 active:bg-neutral-300 active:scale-[0.98] transition cursor-pointer"
                title="Perfil"
              >
                <UserCircle2 size={22} className={TEXT_MAIN} />
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-black/10 bg-white shadow-xl overflow-hidden">
                  <Link
                    href="/painel"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 cursor-pointer"
                    onClick={closeAll}
                  >
                    <User2 size={16} />
                    Meu perfil
                  </Link>
                  <button
                    onClick={async () => {
                      closeAll();
                      await signOut({ callbackUrl: "/login", redirect: true });
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 cursor-pointer"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href={loginHref}
              className="inline-flex items-center gap-2 rounded-md bg-[#ffab40] px-3 py-2 text-sm font-medium text-white hover:opacity-95 active:scale-[0.99] transition"
            >
              <LogIn size={16} />
              Entrar
            </Link>
          )}
        </div>
      </header>

      {/* Drawer (menu hambúrguer) — só existe logado */}
      {authed && (
        <div
          className={`fixed inset-0 z-[49] ${
            navOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-hidden={!navOpen}
        >
          <div
            className={`absolute inset-0 bg-black/30 transition-opacity ${
              navOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setNavOpen(false)}
          />
          <nav
            className={`absolute left-0 top-0 h-full w-[280px] max-w-[85vw] bg-white shadow-2xl transition-transform ${
              navOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ paddingTop: TOPBAR_H }}
          >
            <div className="px-3 py-2 border-b border-neutral-200 flex items-center justify-between">
              <span className={`text-sm font-semibold ${TEXT_MAIN}`}>
                Navegação
              </span>
              <button
                onClick={() => setNavOpen(false)}
                className="grid place-items-center h-8 w-8 rounded-full hover:bg-neutral-100 transition cursor-pointer"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            </div>

            <ul className="p-2">
              {links.map((item) => (
                <li key={item.label}>
                  {item.disabled || !item.href ? (
                    <div
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-neutral-400 cursor-not-allowed"
                      title="Indisponível neste contexto"
                    >
                      <span>{item.label}</span>
                      <ChevronRight size={16} />
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={closeAll}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-neutral-50 text-neutral-800 cursor-pointer"
                    >
                      <span>{item.label}</span>
                      <ChevronRight size={16} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* espaçador para o conteúdo não ficar sob a barra */}
      <div style={{ height: TOPBAR_H }} />
    </>
  );
}
