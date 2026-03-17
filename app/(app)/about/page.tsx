"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto flex w-full max-w-prose flex-col gap-20 px-6 pb-24 pt-20">
        {/* Hero */}
        <section className="space-y-6">
          <h1 className="text-6xl font-bold tracking-tight text-zinc-900">
            About Garden
          </h1>
          <p className="text-xl text-zinc-600 leading-relaxed">
            Garden started with a simple observation: across Honda, people were building useful tools — scripts, dashboards, automations — and most of those tools never made it beyond the team they were built for.
          </p>
          <p className="text-xl text-zinc-600 leading-relaxed">
            Teams were solving the same problems in parallel, without knowing the solution already existed somewhere else in the organization. Good work was going unnoticed, and effort was being duplicated.
          </p>
          <p className="text-xl text-zinc-600 leading-relaxed">
            Garden is Honda&apos;s catalog of internal digital tools — a single place to find what&apos;s already been built, adopt what works, and register what&apos;s new. The goal is simple: before you build something, check if it already exists. And when you build something useful, make sure others can find it.
          </p>
          <p className="text-xl text-zinc-600 leading-relaxed">
            If you have built something that belongs in the catalog, register it — even if it feels small. Every entry makes the catalog more useful for everyone.
          </p>
          <p className="text-xl text-zinc-600 leading-relaxed">
            If you have ideas, issues, or requests, I&apos;d love to hear them. Email me: {" "}
            <a className="underline underline-offset-4" href="mailto:donovan_liao@na.honda.com">
              donovan_liao@na.honda.com
            </a>
            . Or ping me on Teams.
          </p>
        </section>

        {/* CTA */}
        <section className="flex flex-col items-center gap-4 pt-8 text-center">
          <h3 className="text-2xl font-semibold text-zinc-900">Have a tool to register?</h3>
          <Button size="lg" asChild className="mt-2">
            <Link href="/submit">Register a tool</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
