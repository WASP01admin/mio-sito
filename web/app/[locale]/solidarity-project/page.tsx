"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface Section {
  title: string;
  content: string;
  number: number;
}

export default function SolidarityProjectPage() {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const sections: Section[] = [
    {
      number: 1,
      title: "La rete WASP: 1.250 associazioni e 125.000 individui coinvolti",
      content: `WASP dispone di un elenco verificato di 1.250 associazioni animaliste. Stimando in modo conservativo che ciascuna possa contare su 100 persone tra soci, volontari, attivisti, simpatizzanti, followers e staff, otteniamo una comunità di:

125.000 individui che amano gli animali
Una rete già attiva, già motivata, già pronta a partecipare.`,
    },
    {
      number: 2,
      title: "Il gesto minimo: 2 euro all'anno",
      content: `Il modello WASP si basa su un'idea semplice:

Ogni individuo convince una sola attività commerciale (il proprio barbiere, il negozio sotto casa, il commercialista, il bar preferito…) a donare 2 euro all'anno (che ci permettera' di inserirli nella mappa Amici degli Animali - WASP)

Due euro. Una cifra simbolica, sostenibile, che nessuna attività percepisce come un costo.`,
    },
    {
      number: 3,
      title: "Perché le attività accettano? Il vantaggio reputazionale",
      content: `Quando i 125.000 individui coinvolti nel modello WASP si attivano per convincere un'attività commerciale a donare 2 euro all'anno, non stanno chiedendo un favore. Stanno proponendo un vantaggio concreto.

Ogni attività che aderisce al modello WASP comunica ai propri clienti un messaggio chiaro:
"Qui gli animali ci stanno a cuore" e questo ha un valore economico reale.

I sondaggi mostrano che oltre il 70% dei consumatori è sensibile al tema degli animali, chiede maggiore trasparenza alle aziende e tende a preferire le attività che dimostrano attenzione e rispetto verso gli animali se paragonate a quelle che non lo fanno. Quindi, una donazione:
- attira nuovi clienti che condividono gli stessi valori (WASP CARD)
- migliora la reputazione e la visibilita' sul territorio (WASP MAP)
- rafforza la fidelizzazione (WASP PROJECT)
- distingue l'attività dai concorrenti (WASP CULTURE)

Convincere un'attività commerciale diventa quindi più facile: non si tratta di chiedere una donazione, ma di offrire un'opportunità di immagine che vale molto più dei 2 euro versati.`,
    },
    {
      number: 4,
      title: "Il fattore tempo: la crescita automatica (5 anni)",
      content: `Ogni individuo convince una nuova attività ogni anno.

Risultato su 5 anni:
- Anno 1: 125.000 attività coinvolte → 250.000 €
- Anno 2: 250.000 attività coinvolte → 500.000 €
- Anno 3: 375.000 attività coinvolte → 750.000 €
- Anno 4: 500.000 attività coinvolte → 1.000.000 €
- Anno 5: 625.000 attività coinvolte → 1.250.000 €

Totale in 5 anni: 3.750.000 €
Divisi tra 1.250 associazioni = Media di 3.000 € per associazione (modello conservativo)

E questo con una donazione minima, senza chiedere sacrifici alle associazioni né denaro ai cittadini.

N.B. - I numeri non impressionano tanto, ma si tratta di un modello estremamente prudente e conservativo perché non considera: attività che donano più di 2 euro, attività che coinvolgono altre attività, individui che convincono più di una attività all'anno, la reputazione crescente che accelera ulteriormente la partecipazione.

Se tutti i 125.000 WASPs anziche' convincere una sola attivita' commerciale a donare annualmente 2 Euro ne convincessero una al mese, in tre anni TUTTE le aziende, negozi, imprese e professionisti di Italia sarebbero donatori! E porterebbero alle casse delle Associazioni Animaliste oltre 8.000.000 di euro (circa 6.400 Euro annui in media cadauna) ogni anno.`,
    },
    {
      number: 5,
      title: "La spirale virtuosa",
      content: `Il modello WASP non genera solo fondi. Genera cultura.

Si crea così una spirale virtuosa:
- L'attività dona → migliora la reputazione
- I clienti la preferiscono → aumenta la visibilità
- L'attività continua a donare → rafforza la cultura
- Le associazioni ricevono fondi → migliorano i servizi
- La società diventa più attenta ai diritti degli animali`,
    },
  ];

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="bg-black px-4 py-8 text-center text-white sm:px-8 sm:py-12">
        <h1 className="text-3xl font-black text-wasp-yellow sm:text-4xl">
          Solidarity Project
        </h1>
        <p className="mt-2 text-sm text-gray-300 sm:text-base">
          Un modello semplice che può trasformare il sostegno agli animali in Italia... e nel mondo
        </p>
      </section>

      {/* Main Content */}
      <section
        className="relative px-4 py-10 text-black sm:px-8 sm:py-16"
        style={{
          backgroundImage: "url('/images/honeycomb-bg.png')",
          backgroundRepeat: "repeat",
          width: "100%",
        }}
      >
        <div className="mx-auto max-w-2xl">
          {/* Introduction */}
          <div className="mb-10 space-y-4 text-center">
            <p className="text-sm leading-relaxed font-semibold sm:text-base">
              Solidarietà significa aiutare gli animali, certo, ma significa anche aiutare chi aiuta gli animali.
            </p>
            <p className="text-sm leading-relaxed sm:text-base">
              La missione di WASP è creare una comunità unita, riconoscibile, capace di sostenersi reciprocamente attraverso gesti semplici ma potenti.
            </p>
            <p className="text-sm leading-relaxed sm:text-base">
              Per questo WASP mette a disposizione una mappa globale delle attività commerciali donatrici, un vero e proprio "radar della solidarietà" che permette al popolo WASP di sapere chi sono e dove sono le attività che dimostrano attenzione verso la causa animale.
            </p>
          </div>

          {/* Additional context */}
          <div className="mb-10 rounded-lg bg-black/5 p-6 text-center">
            <p className="text-sm leading-relaxed sm:text-base">
              Scegliere queste attività non è solo un atto di consumo: è un gesto di solidarietà verso chi ha deciso di schierarsi dalla parte degli animali.
            </p>
            <p className="mt-4 text-sm leading-relaxed font-semibold sm:text-base">
              E la solidarietà è reciproca.
            </p>
            <p className="mt-4 text-sm leading-relaxed sm:text-base">
              Molte attività presenti sulla mappa WASP offrono ai membri della comunità WASP trattamenti speciali. Non si tratta necessariamente di sconti o benefici materiali: può essere un piccolo gesto, un'attenzione, una stretta di mano. Un riconoscimento che dice: "Siamo dalla stessa parte."
            </p>
          </div>

          {/* Collapsible Sections */}
          <div className="mb-10 space-y-3">
            <h2 className="mb-6 text-center text-lg font-bold sm:text-xl">
              I numeri della solidarietà
            </h2>
            {sections.map((section) => (
              <div
                key={section.number}
                className="rounded-lg border-2 border-black/20 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedSection(
                      expandedSection === section.number ? null : section.number
                    )
                  }
                  className="w-full bg-black/5 px-4 py-3 text-left font-bold text-black transition-colors hover:bg-black/10 flex items-center justify-between"
                >
                  <span className="flex items-center gap-3 text-sm sm:text-base">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wasp-yellow text-black text-xs font-bold">
                      {section.number}
                    </span>
                    {section.title}
                  </span>
                  <span className="text-lg">
                    {expandedSection === section.number ? "−" : "+"}
                  </span>
                </button>
                {expandedSection === section.number && (
                  <div className="bg-white/50 px-4 py-4 text-sm leading-relaxed whitespace-pre-line sm:text-base">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Conclusion */}
          <div className="rounded-lg bg-black/5 p-6 text-center">
            <h3 className="mb-4 text-lg font-bold sm:text-xl">Conclusione</h3>
            <p className="text-sm leading-relaxed sm:text-base">
              WASP non chiede grandi donazioni. Non chiede sacrifici economici. Non chiede rivoluzioni.
            </p>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              Chiede un gesto minimo, che può generare:
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed sm:text-base">
              <li>• milioni di euro per il benessere animale</li>
              <li>• una nuova cultura diffusa</li>
              <li>• un ecosistema che si auto-alimenta</li>
              <li>• un beneficio concreto per ogni associazione</li>
            </ul>
            <p className="mt-4 font-bold text-sm sm:text-base">
              Un progetto semplice. Un impatto enorme. Una nuova cultura.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
