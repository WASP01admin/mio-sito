"use client";
import { useState } from "react";
import Image from "next/image";

export default function StudiESondaggiPage() {
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    {
      id: "risultati-ricerca",
      title: "Risultati di Ricerca",
      content: "Le più recenti ricerche sul comportamento dei consumatori confermano una forte preferenza per le aziende che danno priorità al benessere degli animali. Molteplici studi globali dimostrano che l'impegno verso una gestione etica influenza le decisioni d'acquisto e la fiducia nel marchio.",
    },
    {
      id: "sequenza-cronologica",
      title: "Sequenza Cronologica (2012-2026)",
      content: "Studi fondamentali che dimostrano la tendenza in accelerazione della spesa consapevole. Dal 2012 al 2026 si è registrato un cambiamento senza precedenti nel comportamento dei consumatori riguardo al benessere animale.",
    },
    {
      id: "sondaggi-wasp",
      title: "Sondaggi WASP (Ricerca sul campo)",
      content: "Abbiamo eseguito due sondaggi (con un totale di oltre 1.000 intervistati) per verificare se la tendenza trovava riscontro nella realtà. I risultati confermano le tendenze globali riportate nella ricerca accademica internazionale.",
    },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-black px-4 py-8 text-center text-white sm:px-8 sm:py-12">
        <h1 className="text-3xl font-black text-wasp-yellow sm:text-4xl">
          Studi e Sondaggi
        </h1>
      </section>

      <section
        className="relative px-4 py-10 text-black sm:px-8 sm:py-16"
        style={{
          backgroundImage: "url('/images/honeycomb-bg.png')",
          backgroundRepeat: "repeat",
          width: "100%",
        }}
      >
        <div className="mx-auto max-w-2xl">
          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className="rounded-lg border-2 border-black/20 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedSection(
                      expandedSection === section.id ? null : section.id
                    )
                  }
                  className="w-full bg-black/5 px-4 py-3 text-left font-bold text-black transition-colors hover:bg-black/10 flex items-center justify-between"
                >
                  <span className="text-sm sm:text-base">{section.title}</span>
                  <span className="text-lg">
                    {expandedSection === section.id ? "−" : "+"}
                  </span>
                </button>
                {expandedSection === section.id && (
                  <div className="bg-white/50 px-4 py-4 text-sm leading-relaxed sm:text-base">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
