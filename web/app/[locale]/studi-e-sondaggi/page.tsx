"use client";
import { useState } from "react";
import Image from "next/image";

interface Study {
  id: string;
  number: number;
  title: string;
  content: string;
}

export default function StudiESondaggiPage() {
  const [expandedStudy, setExpandedStudy] = useState<string | null>(null);

  const studies: Study[] = [
    {
      id: "study-1",
      number: 1,
      title: "Studio globale dell'Università di Portsmouth (2024–2026)",
      content: `Uno studio approfondito pubblicato sulla rivista Food Quality and Preference ha coinvolto quasi 3.200 partecipanti in cinque Paesi europei (Cechia, Spagna, Svezia, Svizzera e Regno Unito).

Risultato principale: i consumatori attribuiscono maggiore importanza agli aspetti legati al benessere animale (come "allevato all'aperto" e "nutrito al pascolo") rispetto agli indicatori di sostenibilità ambientale (come l'impronta di carbonio e gli imballaggi sostenibili) nella scelta di carne e latticini.

Impatto: i ricercatori hanno concluso che il benessere animale, la freschezza e la qualità rappresentano i principali fattori non legati al prezzo che guidano i consumatori moderni. I dati dettagliati di questo studio sono disponibili tramite il Portale della Ricerca dell'Università di Portsmouth.`,
    },
    {
      id: "study-2",
      number: 2,
      title: "Indagine congiunta di Euroconsumers (2024)",
      content: `Una vasta indagine collaborativa ha coinvolto 8.070 persone in diversi Paesi europei, tra cui Italia, Spagna, Belgio e Portogallo.

Risultato principale: il 69% degli intervistati ha dichiarato di essere disposto a pagare di più per alimenti prodotti secondo standard più elevati di benessere animale.

Impatto: il rapporto evidenzia che i consumatori chiedono sempre più cambiamenti legislativi e aziendali, trasformando il benessere animale da una scelta di nicchia a un requisito fondamentale per il mercato di massa.`,
    },
    {
      id: "study-3",
      number: 3,
      title: "Esperimento nel Regno Unito sulle etichette relative al benessere animale (2025)",
      content: `Un esperimento controllato di tipo "shelf-test" ha valutato i modelli di acquisto dei consumatori sulla base della trasparenza aziendale e delle valutazioni delle pratiche di allevamento.

Risultato principale: le valutazioni relative al benessere animale hanno rappresentato il 49,3% del peso nelle decisioni di acquisto. Si tratta di un'influenza più che doppia rispetto al prezzo del prodotto (23,5%) e nettamente superiore all'origine geografica (16%).

Impatto: il 71% degli acquirenti ha confermato esplicitamente di preferire prodotti provenienti da aziende che adottano pratiche ad alto livello di benessere animale, anche quando il prezzo è superiore alla media.`,
    },
    {
      id: "study-4",
      number: 4,
      title: "Analisi dei dati reali di un supermercato svizzero (2025)",
      content: `Uno studio pubblicato sulla piattaforma economica ArXiv/RePEc ha analizzato il comportamento d'acquisto reale dei consumatori, anziché semplici dichiarazioni nei sondaggi, monitorando le scelte dei clienti presso una grande catena di supermercati svizzera.

Risultato principale: standard aziendali più elevati di benessere animale hanno generato in modo costante premi di prezzo significativi. In media, un aumento di un punto su un indice di benessere da 1 a 5 corrispondeva a un incremento del 16,4% della disponibilità dei consumatori ad accettare un prezzo più elevato, che saliva al 25,3% per latticini e uova.

Impatto: le considerazioni etiche svolgono un ruolo quantificabile e dimostrato nella creazione di valore economico per le aziende che investono nel benessere degli animali.`,
    },
    {
      id: "study-5",
      number: 5,
      title: "Settori degli alimenti per animali domestici e della cosmetica (metriche 2026)",
      content: `La domanda si estende oltre l'allevamento anche ad altri grandi comparti del commercio al dettaglio:

Industria degli alimenti per animali domestici: uno studio di mercato del 2026 ha evidenziato che l'81,1% dei proprietari di animali considera il benessere animale un fattore determinante nella scelta dei marchi. I dati indicano che i proprietari tendono naturalmente a estendere la propria empatia anche agli altri animali, rendendo il marketing incentrato sul benessere animale più redditizio rispetto alle generiche campagne sulla sostenibilità.

Cosmetica e prodotti di bellezza: i dati sui consumatori di GlobalData mostrano che il 44% degli acquirenti a livello globale cerca attivamente una certificazione "cruelty-free" prima di acquistare prodotti per la cura della persona, indicando una perdita di quota di mercato per le aziende che non adottano tali politiche.`,
    },
  ];

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="bg-black px-4 py-8 text-center text-white sm:px-8 sm:py-12">
        <h1 className="text-3xl font-black text-wasp-yellow sm:text-4xl">
          Studi e Sondaggi
        </h1>
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
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Introduction - Always Visible */}
          <div className="space-y-4">
            <p className="text-sm leading-relaxed sm:text-base font-semibold">
              Le più recenti ricerche sul comportamento dei consumatori confermano una forte preferenza per le aziende che danno priorità al benessere degli animali. Molteplici studi globali dimostrano che l'impegno di un'azienda verso una gestione etica degli animali influenza direttamente le decisioni d'acquisto, la disponibilità a pagare un sovrapprezzo e la fiducia nel marchio.
            </p>
            <p className="text-sm leading-relaxed sm:text-base">
              I più importanti studi recenti e rapporti di mercato che descrivono questo cambiamento includono:
            </p>
          </div>

          {/* PARTE 1: Collapsible Studies */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold mb-4">Risultati di Ricerca</h2>
            {studies.map((study) => (
              <div
                key={study.id}
                className="rounded-lg border-2 border-black/20 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedStudy(
                      expandedStudy === study.id ? null : study.id
                    )
                  }
                  className="w-full bg-black/5 px-4 py-3 text-left font-bold text-black transition-colors hover:bg-black/10 flex items-center justify-between"
                >
                  <span className="text-sm sm:text-base">{study.number}. {study.title}</span>
                  <span className="text-lg">
                    {expandedStudy === study.id ? "−" : "+"}
                  </span>
                </button>
                {expandedStudy === study.id && (
                  <div className="bg-white/50 px-4 py-4 text-sm leading-relaxed whitespace-pre-line sm:text-base">
                    {study.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chronological Sequence - Always Visible */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Sequenza Cronologica</h2>
            <p className="text-sm leading-relaxed sm:text-base font-semibold">
              Sequenza cronologica degli studi fondamentali e dei sistemi di monitoraggio dei dati che dimostrano la tendenza in accelerazione della spesa consapevole riguardo al benessere degli animali.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm mb-2">Fase 1: 2012 (La base dell'empatia)</h3>
                <p className="text-xs leading-relaxed">
                  <strong>Lo studio:</strong> Consumer Attitudes to Animal Welfare Report dell'Institute of Grocery Distribution (IGD).
                </p>
                <p className="text-xs leading-relaxed mt-2">
                  <strong>I dati:</strong> Storicamente, i ricercatori hanno osservato un significativo "divario atteggiamento-comportamento". I consumatori dichiaravano di preoccuparsi del benessere animale, ma, osservandone il comportamento alle casse, prezzo e praticità determinavano quasi interamente gli acquisti.
                </p>
                <p className="text-xs leading-relaxed mt-2">
                  <strong>Conclusione:</strong> Nel 2012, il benessere animale era considerato dalle aziende uno strumento di pubbliche relazioni o una nicchia di lusso, poiché la spesa effettiva dei consumatori raramente rifletteva tali convinzioni.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm mb-2">Fase 2: 2015 vs. 2023 (Il balzo longitudinale dell'Eurobarometro)</h3>
                <p className="text-xs leading-relaxed">
                  La prova più concreta dell'accelerazione proviene dall'Eurobarometro speciale della Commissione europea sugli atteggiamenti degli europei nei confronti del benessere animale, che utilizza metodologie identiche per monitorare i cambiamenti nel tempo.
                </p>
                <p className="text-xs leading-relaxed mt-2">
                  <strong>Valori di riferimento del 2015:</strong> Nel 2015, una netta maggioranza degli europei concordava sull'importanza del benessere animale, ma l'intenzione di spesa era fortemente sensibile alle variazioni dei prezzi.
                </p>
                <p className="text-xs leading-relaxed mt-2">
                  <strong>Monitoraggio 2023 (Eurobarometro 533):</strong> Coinvolgendo 26.376 cittadini, l'indagine ha registrato un cambiamento senza precedenti. Nonostante la raccolta dei dati sia avvenuta nel marzo 2023, durante un periodo di storica e grave inflazione dei prezzi alimentari in Europa, un sorprendente 60% degli intervistati ha dichiarato esplicitamente di essere disposto a pagare di più per prodotti rispettosi del benessere animale.
                </p>
                <p className="text-xs leading-relaxed mt-2">
                  <strong>Conclusione:</strong> I dati hanno dimostrato che la spesa consapevole si era consolidata come un valore fondamentale e non negoziabile. Anche durante una crisi inflazionistica, la maggioranza ha rifiutato di scendere a compromessi sulla produzione etica.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm mb-2">Fase 3: 2024 (L'inversione delle priorità dei consumatori)</h3>
                <p className="text-xs leading-relaxed">
                  <strong>Gli studi:</strong> AHDB & Blue Marble Consumer Tracker, insieme allo studio globale dell'Università di Portsmouth.
                </p>
                <p className="text-xs leading-relaxed mt-2">
                  <strong>I dati:</strong> All'inizio del 2024, il monitoraggio nel Regno Unito condotto da IGD ha rilevato che l'84% degli acquirenti considerava il benessere animale un elemento etico fondamentale, rendendolo il secondo fattore più importante in assoluto dopo la freschezza degli alimenti (96%).
                </p>
                <p className="text-xs leading-relaxed mt-2">
                  <strong>L'indicatore di accelerazione:</strong> Questo è l'anno in cui le scienze comportamentali hanno dimostrato una fondamentale inversione di tendenza: il benessere animale ha ufficialmente superato gli indicatori ambientali "green". Quando costretti a scegliere, i consumatori, in diversi studi, hanno dato priorità alle etichette "allevato al pascolo" e "allevato nel rispetto del benessere animale" rispetto all'impronta di carbonio, ai chilometri alimentari (food miles) o alle certificazioni biologiche.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm mb-2">Fase 4: 2025–2026 (La dura realtà economica)</h3>
                <p className="text-xs leading-relaxed">
                  <strong>Gli studi:</strong> Swiss Supermarket Network Tracker (RePEc) e aggiornamenti del mercato globale.
                </p>
                <p className="text-xs leading-relaxed mt-2">
                  <strong>I dati:</strong> Andando oltre i sondaggi basati sulle dichiarazioni dei consumatori, i dati di mercato reali raccolti fino alla metà del 2026 confermano che gli investimenti di un'azienda nel benessere animale generano rendimenti economici scalabili. Ogni incremento numerico negli indici commerciali di benessere animale è correlato a un aumento immediato dal 16,4% al 25,3% dell'accettazione da parte dei consumatori di un sovrapprezzo.
                </p>
                <p className="text-xs leading-relaxed mt-2">
                  <strong>Conclusione:</strong> La spesa consapevole è passata con successo dal settore zootecnico al più ampio comparto della vendita al dettaglio, influenzando fortemente gli indicatori di crescita del mercato degli alimenti per animali domestici (dove l'81,1% dei consumatori richiede oggi approvvigionamenti rispettosi degli animali) e del settore cosmetico (dove il 44% degli acquirenti a livello globale rifiuta esplicitamente marchi privi di etichettatura cruelty-free).
                </p>
              </div>
            </div>

            <div className="bg-black/5 p-4 rounded-lg">
              <h3 className="font-bold text-sm mb-3">CONCLUSIONI:</h3>
              <ul className="text-xs leading-relaxed space-y-2 list-disc list-inside">
                <li><strong>La resistenza all'inflazione:</strong> La disponibilità dei consumatori a pagare un prezzo maggiore per il benessere animale è aumentata anche quando il costo della spesa alimentare è cresciuto sensibilmente. Ciò dimostra che si tratta di un comportamento stabile e duraturo, non di una tendenza passeggera.</li>
                <li><strong>L'inversione del paradigma "green":</strong> In passato, i consumatori attenti cercavano etichette generiche come "Eco/Green". La tendenza si è accelerata verso una trasparenza specificamente incentrata sugli animali (ad esempio cage-free, free-range, cruelty-free), che i consumatori oggi valorizzano più degli indicatori relativi alle emissioni di carbonio.</li>
                <li><strong>La riduzione del divario:</strong> Lo storico "divario atteggiamento-comportamento" si è ridotto radicalmente nell'ultimo decennio grazie alla trasparenza digitale, al controllo esercitato dai social media e a un'etichettatura chiara nei punti vendita.</li>
              </ul>
            </div>
          </div>

          {/* PARTE 2: Surveys - Always Visible, No Collapse */}
          <div className="space-y-4 border-t-2 border-black/20 pt-8">
            <h2 className="text-lg font-bold">Sondaggi WASP (Ricerca sul campo)</h2>
            <p className="text-sm leading-relaxed sm:text-base">
              Abbiamo voluto 'verificare' sul campo se questa tendenza trovava riscontro nella realtà ed abbiamo eseguito due sondaggi (con un totale di oltre 1.000 intervistati): online e per strada.
            </p>

            <div className="bg-black/5 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-3">
                In entrambi i casi è stata fatta questa domanda secca [SI / NO]:
              </p>
              <p className="text-sm italic leading-relaxed border-l-4 border-wasp-yellow pl-4">
                "Sapere che un'attività commerciale dona denaro a un'Associazione Animalista la rende più attraente rispetto alla concorrenza (a parità di beni e servizi e di prezzo)?"
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-sm">Ecco i risultati del sondaggio ONLINE:</h3>
              <div className="relative w-full bg-white rounded-lg overflow-hidden">
                <Image
                  src="/images/studies-chart-1.png"
                  alt="Risultati sondaggio online"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs leading-relaxed">
                <strong>I risultati del sondaggio 'per strada':</strong> In linea con i dati delle ricerche e con il sondaggio online.
              </p>
              <p className="text-xs leading-relaxed mt-2">
                <strong>N.B.</strong> Pensiamo che la percentuale di 9 punti rispetto all'ONLINE sia stata dovuta al fatto che il sondaggio era in presenza e per gli intervistati sarebbe stato, a dir poco, imbarazzante dare risultati negativi.
              </p>
            </div>

            <p className="text-sm leading-relaxed sm:text-base font-semibold">
              I dati confermano le tendenze globali riportate nella ricerca accademica internazionale.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
