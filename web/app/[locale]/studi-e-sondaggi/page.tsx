"use client";
import { useState } from "react";
import Image from "next/image";

interface Study {
  id: string;
  number: number;
  title: string;
  content: string;
}

interface Phase {
  id: string;
  number: number;
  title: string;
  content: string;
}

export default function StudiESondaggiPage() {
  const [expandedStudy, setExpandedStudy] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const studies: Study[] = [
    {id: "s1", number: 1, title: "Studio globale dell'Università di Portsmouth (2024–2026)", content: "Uno studio approfondito pubblicato sulla rivista Food Quality and Preference ha coinvolto quasi 3.200 partecipanti in cinque Paesi europei (Cechia, Spagna, Svezia, Svizzera e Regno Unito).\n\nRisultato principale: i consumatori attribuiscono maggiore importanza agli aspetti legati al benessere animale (come \"allevato all'aperto\" e \"nutrito al pascolo\") rispetto agli indicatori di sostenibilità ambientale.\n\nImpatto: il benessere animale, la freschezza e la qualità rappresentano i principali fattori non legati al prezzo che guidano i consumatori moderni."},
    {id: "s2", number: 2, title: "Indagine congiunta di Euroconsumers (2024)", content: "Una vasta indagine collaborativa ha coinvolto 8.070 persone in diversi Paesi europei, tra cui Italia, Spagna, Belgio e Portogallo.\n\nRisultato principale: il 69% degli intervistati ha dichiarato di essere disposto a pagare di più per alimenti prodotti secondo standard più elevati di benessere animale.\n\nImpatto: il benessere animale è passato da scelta di nicchia a requisito fondamentale per il mercato di massa."},
    {id: "s3", number: 3, title: "Esperimento nel Regno Unito sulle etichette relative al benessere animale (2025)", content: "Un esperimento controllato di tipo \"shelf-test\" ha valutato i modelli di acquisto dei consumatori.\n\nRisultato principale: le valutazioni relative al benessere animale hanno rappresentato il 49,3% del peso nelle decisioni di acquisto (più che doppio rispetto al prezzo del 23,5%).\n\nImpatto: il 71% degli acquirenti ha confermato esplicitamente di preferire prodotti provenienti da aziende ad alto livello di benessere animale, anche quando il prezzo è superiore."},
    {id: "s4", number: 4, title: "Analisi dei dati reali di un supermercato svizzero (2025)", content: "Uno studio ha analizzato il comportamento d'acquisto reale dei consumatori presso una grande catena di supermercati svizzera.\n\nRisultato principale: un aumento di un punto su un indice di benessere corrispondeva a un incremento del 16,4% della disponibilità dei consumatori ad accettare un prezzo più elevato (25,3% per latticini e uova).\n\nImpatto: le considerazioni etiche svolgono un ruolo quantificabile e dimostrato nella creazione di valore economico."},
    {id: "s5", number: 5, title: "Settori degli alimenti per animali domestici e della cosmetica (metriche 2026)", content: "La domanda si estende oltre l'allevamento anche ad altri grandi comparti del commercio al dettaglio.\n\nAlimenti per animali domestici: l'81,1% dei proprietari di animali considera il benessere animale un fattore determinante nella scelta dei marchi.\n\nCosmetica: il 44% degli acquirenti a livello globale cerca attivamente una certificazione \"cruelty-free\"."},
  ];

  const phases: Phase[] = [
    {id: "p1", number: 1, title: "2012 (La base dell'empatia)", content: "Lo studio: Consumer Attitudes to Animal Welfare Report dell'Institute of Grocery Distribution (IGD).\n\nI dati: Storicamente, i ricercatori hanno osservato un significativo \"divario atteggiamento-comportamento\". I consumatori dichiaravano di preoccuparsi del benessere animale, ma il prezzo e la praticità determinavano quasi interamente gli acquisti.\n\nConclusione: Nel 2012, il benessere animale era considerato dalle aziende uno strumento di pubbliche relazioni o una nicchia di lusso."},
    {id: "p2", number: 2, title: "2015 vs. 2023 (Il balzo longitudinale dell'Eurobarometro)", content: "La prova più concreta dell'accelerazione proviene dall'Eurobarometro speciale della Commissione europea.\n\nValori di riferimento del 2015: Una netta maggioranza degli europei concordava sull'importanza del benessere animale, ma l'intenzione di spesa era fortemente sensibile alle variazioni dei prezzi.\n\nMonitoraggio 2023 (Eurobarometro 533): Coinvolgendo 26.376 cittadini, un sorprendente 60% degli intervistati ha dichiarato esplicitamente di essere disposto a pagare di più per prodotti rispettosi del benessere animale, nonostante l'inflazione.\n\nConclusione: La spesa consapevole si era consolidata come un valore fondamentale e non negoziabile."},
    {id: "p3", number: 3, title: "2024 (L'inversione delle priorità dei consumatori)", content: "Gli studi: AHDB & Blue Marble Consumer Tracker, insieme allo studio globale dell'Università di Portsmouth.\n\nI dati: L'84% degli acquirenti considerava il benessere animale un elemento etico fondamentale, rendendolo il secondo fattore più importante assoluto dopo la freschezza degli alimenti (96%).\n\nL'indicatore di accelerazione: Il benessere animale ha ufficialmente superato gli indicatori ambientali \"green\". I consumatori hanno dato priorità alle etichette \"allevato al pascolo\" rispetto all'impronta di carbonio."},
    {id: "p4", number: 4, title: "2025–2026 (La dura realtà economica)", content: "Gli studi: Swiss Supermarket Network Tracker (RePEc) e aggiornamenti del mercato globale.\n\nI dati: I dati di mercato reali confermano che gli investimenti di un'azienda nel benessere animale generano rendimenti economici scalabili. Ogni incremento negli indici commerciali di benessere animale è correlato a un aumento dal 16,4% al 25,3% dell'accettazione di un sovrapprezzo.\n\nConclusione: La spesa consapevole è passata con successo dal settore zootecnico al più ampio comparto della vendita al dettaglio."},
  ];

  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-black px-4 py-8 text-center text-white sm:px-8 sm:py-12">
        <h1 className="text-3xl font-black text-wasp-yellow sm:text-4xl">Studi e Sondaggi</h1>
      </section>

      <section className="relative px-4 py-10 text-black sm:px-8 sm:py-16" style={{backgroundImage: "url('/images/honeycomb-bg.png')", backgroundRepeat: "repeat", width: "100%"}}>
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed sm:text-base font-semibold">Le più recenti ricerche sul comportamento dei consumatori confermano una forte preferenza per le aziende che danno priorità al benessere degli animali. Molteplici studi globali dimostrano che l'impegno di un'azienda verso una gestione etica degli animali influenza direttamente le decisioni d'acquisto, la disponibilità a pagare un sovrapprezzo e la fiducia nel marchio.</p>
            <p className="text-sm leading-relaxed sm:text-base">I più importanti studi recenti che descrivono questo cambiamento includono:</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold mb-4">Risultati di Ricerca</h2>
            {studies.map((study) => (
              <div key={study.id} className="rounded-lg border-2 border-black/20 overflow-hidden">
                <button onClick={() => setExpandedStudy(expandedStudy === study.id ? null : study.id)} className="w-full bg-black/5 px-4 py-3 text-left font-bold text-black transition-colors hover:bg-black/10 flex items-center justify-between">
                  <span className="text-sm sm:text-base">{study.number}. {study.title}</span>
                  <span className="text-lg">{expandedStudy === study.id ? "−" : "+"}</span>
                </button>
                {expandedStudy === study.id && (
                  <div className="bg-white/50 px-4 py-4 text-sm leading-relaxed whitespace-pre-line sm:text-base">{study.content}</div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t-2 border-black/20 pt-8">
            <h2 className="text-lg font-bold">Sequenza Cronologica</h2>
            <p className="text-sm leading-relaxed sm:text-base font-semibold">Sequenza cronologica degli studi fondamentali e dei sistemi di monitoraggio dei dati che dimostrano la tendenza in accelerazione della spesa consapevole riguardo al benessere degli animali:</p>
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
            <div className="bg-black/5 p-4 rounded-lg">
              <h3 className="font-bold text-sm mb-3">CONCLUSIONI:</h3>
              <ul className="text-xs leading-relaxed space-y-2 list-disc list-inside">
                <li><strong>La resistenza all'inflazione:</strong> La disponibilità dei consumatori a pagare un prezzo maggiore per il benessere animale è aumentata anche quando il costo della spesa alimentare è cresciuto sensibilmente.</li>
                <li><strong>L'inversione del paradigma "green":</strong> In passato, i consumatori attenti cercavano etichette generiche come "Eco/Green". La tendenza si è accelerata verso una trasparenza specificamente incentrata sugli animali.</li>
                <li><strong>La riduzione del divario:</strong> Lo storico "divario atteggiamento-comportamento" si è ridotto radicalmente nell'ultimo decennio grazie alla trasparenza digitale e all'etichettatura chiara.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 border-t-2 border-black/20 pt-8">
            <h2 className="text-lg font-bold">Sondaggi WASP (Ricerca sul campo)</h2>
            <p className="text-sm leading-relaxed sm:text-base">Abbiamo voluto 'verificare' sul campo se questa tendenza trovava riscontro nella realtà ed abbiamo eseguito due sondaggi (con un totale di oltre 1.000 intervistati): online e per strada.</p>
            <p className="text-sm leading-relaxed sm:text-base">In entrambi i casi è stata fatta questa domanda secca [SI / NO]:</p>
            <div className="bg-black/5 p-4 rounded-lg border-l-4 border-wasp-yellow">
              <p className="text-sm italic leading-relaxed">"Sapere che un'attività commerciale dona denaro a un'Associazione Animalista la rende più attraente rispetto alla concorrenza (a parità di beni e servizi e di prezzo)?"</p>
            </div>

            <h3 className="font-bold text-sm">Ecco i risultati del sondaggio ONLINE:</h3>
            <Image src="/images/studies-chart-1.png" alt="Sondaggio ONLINE" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" priority />

            <Image src="/images/studies-parte2-1.png" alt="Grafico 1" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />
            <Image src="/images/studies-parte2-2.jpg" alt="Grafico 2" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />
            <Image src="/images/studies-parte2-3.jpg" alt="Grafico 3" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />
            <Image src="/images/studies-parte2-4.jpg" alt="Grafico 4" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />
            <Image src="/images/studies-parte2-5.jpg" alt="Grafico 5" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />

            <h3 className="font-bold text-sm">I risultati del sondaggio 'per strada' sono stati questi:</h3>
            <Image src="/images/studies-parte2-6.png" alt="Sondaggio per strada (Pie Chart 79/21)" width={600} height={400} className="w-full h-auto rounded-lg border border-gray-300" />

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs leading-relaxed">In linea con i dati delle ricerche e con il sondaggio online.</p>
              <p className="text-xs leading-relaxed mt-2"><strong>N.B.</strong> Pensiamo che la percentuale di 9 punti di discrepanza rispetto all'ONLINE sia stata dovuta al fatto che il sondaggio era in presenza e per gli intervistati sarebbe stato, a dir poco, imbarazzante dare risultati più negativi.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
