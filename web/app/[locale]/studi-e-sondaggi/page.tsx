"use client";
import { useState } from "react";
import Image from "next/image";

interface Phase {
  id: string;
  number: number;
  title: string;
  content: string;
}

export default function StudiESondaggiPage() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const phases: Phase[] = [
    {id: "phase-1", number: 1, title: "2012 (La base dell'empatia)", content: "Lo studio: Consumer Attitudes to Animal Welfare Report dell'IGD\n\nI dati: Divario atteggiamento-comportamento. Consumatori preoccupati ma prezzo e praticità determinavano gli acquisti.\n\nConclusione: Benessere animale considerato nicchia di lusso."},
    {id: "phase-2", number: 2, title: "2015 vs. 2023 (Il balzo longitudinale)", content: "Eurobarometro 2015: Maggioranza d'accordo ma fortemente sensibile ai prezzi.\n\nEurobarometro 2023: Sorprendente 60% disposto a pagare di più nonostante grave inflazione alimentare.\n\nConclusione: Spesa consapevole consolidata come valore fondamentale e non negoziabile."},
    {id: "phase-3", number: 3, title: "2024 (L'inversione delle priorità)", content: "84% degli acquirenti considera benessere animale elemento etico fondamentale (secondo dopo freschezza - 96%).\n\nBenessere animale ha ufficialmente superato indicatori ambientali 'green'.\n\nConsumatori danno priorità alle etichette 'allevato al pascolo' rispetto all'impronta di carbonio."},
    {id: "phase-4", number: 4, title: "2025-2026 (La dura realtà economica)", content: "Ogni incremento numerico su indice benessere corrisponde a 16,4%-25,3% di accettazione sovrapprezzo.\n\nSpesa consapevole ha successo nel mercato alimenti per animali domestici (81,1%) e cosmetico (44% cruelty-free).\n\nConclusione: Rendimenti economici scalabili per aziende che investono nel benessere."},
  ];

  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-black px-4 py-8 text-center text-white sm:px-8 sm:py-12">
        <h1 className="text-3xl font-black text-wasp-yellow sm:text-4xl">Studi e Sondaggi</h1>
      </section>

      <section
        className="relative px-4 py-10 text-black sm:px-8 sm:py-16"
        style={{backgroundImage: "url('/images/honeycomb-bg.png')", backgroundRepeat: "repeat", width: "100%"}}
      >
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed sm:text-base font-semibold">Le più recenti ricerche confermano una forte preferenza per le aziende che danno priorità al benessere degli animali. Molteplici studi globali dimostrano che l'impegno verso una gestione etica influenza direttamente le decisioni d'acquisto, la disponibilità a pagare un sovrapprezzo e la fiducia nel marchio.</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold mb-4">5 Studi Globali - Risultati di Ricerca</h2>
            <p className="text-sm text-gray-600">Clicca sul + per espandere i dettagli di ogni studio</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold">Sequenza Cronologica (2012-2026)</h2>
            <p className="text-sm leading-relaxed sm:text-base font-semibold">Espandi le 4 fasi collassabili per scoprire come la spesa consapevole si è accelerata negli ultimi 14 anni:</p>
            {phases.map((phase) => (
              <div key={phase.id} className="rounded-lg border-2 border-black/20 overflow-hidden">
                <button onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)} className="w-full bg-black/5 px-4 py-3 text-left font-bold text-black transition-colors hover:bg-black/10 flex items-center justify-between">
                  <span className="text-sm sm:text-base">Fase {phase.number}: {phase.title}</span>
                  <span className="text-lg">{expandedPhase === phase.id ? "−" : "+"}</span>
                </button>
                {expandedPhase === phase.id && (
                  <div className="bg-white/50 px-4 py-4 text-sm leading-relaxed whitespace-pre-line sm:text-base">{phase.content}</div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t-2 border-black/20 pt-8">
            <h2 className="text-lg font-bold">Sondaggi WASP e Grafici Analitici</h2>
            <p className="text-sm leading-relaxed">Ricerca sul campo: oltre 1.000 intervistati (online e per strada) hanno confermato le tendenze globali della ricerca accademica internazionale.</p>
            
            <div className="space-y-4">
              <Image src="/images/studies-chart-1.png" alt="Sondaggio ONLINE" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" priority />
              <Image src="/images/studies-parte2-1.png" alt="Grafico Tendenze" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />
              <Image src="/images/studies-parte2-2.jpg" alt="Analisi Dati 1" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />
              <Image src="/images/studies-parte2-3.jpg" alt="Analisi Dati 2" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />
              <Image src="/images/studies-parte2-4.jpg" alt="Analisi Dati 3" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />
              <Image src="/images/studies-parte2-5.jpg" alt="Analisi Dati 4" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />
              <Image src="/images/studies-parte2-6.png" alt="Conclusioni Grafiche" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />
            </div>

            <div className="bg-black/5 p-4 rounded-lg mt-4">
              <p className="text-sm leading-relaxed font-semibold">I dati confermano le tendenze globali riportate nella ricerca accademica internazionale.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
