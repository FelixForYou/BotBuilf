"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { checkSession, type SessionCheck } from "@/lib/api";
import { ConfigError } from "./ConfigError";
import { Unreachable } from "./Protected";
import { ConnectForm } from "./views/ConnectForm";

/** Halaman awal: sudah terhubung → Workspace; belum → formulir koneksi. */
export function HomeGate() {
  const router = useRouter();
  const [check, setCheck] = useState<SessionCheck | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setExpired(new URLSearchParams(window.location.search).get("expired") === "1");
    checkSession(true).then((r) => {
      if (r.state === "connected") router.replace("/workspace");
      else setCheck(r);
    });
  }, [router]);

  if (!check) return <div className="min-h-dvh" />;
  if (check.state === "config") return <ConfigError message={check.message} />;
  if (check.state === "unreachable") return <Unreachable message={check.message} />;
  return <ConnectForm expired={expired} />;
}
