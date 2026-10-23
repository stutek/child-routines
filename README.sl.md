# Otrokove rutine

[English](README.md) · **Slovenščina**

**[Odprite izdelovalnik listov →](https://stutek.github.io/child-routines/)**

Natisljivi listi A4 z dnevno rutino za otroke od 2 do 6 let: jutro, večerja in večer. List obesite na hladilnik. Otrok sledi sličicam in na krog ob vsakem opravljenem koraku položi magnetek. Odrasli na listu preberejo vrstni red in uro.

![Trije vzorčni listi: jutro, večerja in večer](docs/preview.jpg)

Brezplačno, brez prijave in brez oglasov. Kar vpišete, ostane v vašem brskalniku.

## Kako naredim svoj list

1. Odprite [izdelovalnik](https://stutek.github.io/child-routines/). Začne s primerom večerne rutine.
2. Izberite vrsto rutine (jutro, dan, večer) in vpišite do 8 korakov. Sličico stran izbere sama; kliknite nanjo, če jo želite zamenjati. Vrstni red spremenite tako, da vrstico povlečete za pike na levi. Ura je neobvezna: prazno polje lahko izpolnite kasneje s pisalom.
3. Kliknite **Natisni**. V oknu za tiskanje izberite papir A4, robove *Brez* in merilo 100 %. Če želite list poslati babici ali tiskarni, namesto tiskalnika izberite *Shrani kot PDF*.

## Kako ga uporabljamo

- **List sestavite skupaj z otrokom** in ga prve dni skupaj prehodite. Naj izbere sličice; vrstni red določite vi.
- **Magnetek na krogu pomeni »narejeno«.** Ni nagrada: ne jemljite ga za kazen in ne vežite nanj sladkarij ali risank.
- **Ura je za odrasle.** Majhen otrok se ravna po vrstnem redu sličic, ne po uri.
- **Ko otrok prespi pri starih starših ali sorodnikih,** naj gre list z njim: tudi oni vidijo, kaj sledi in kdaj.

Vzorčni listi so [tu](https://stutek.github.io/child-routines/output/sl-primer.html), pripravljeni za tisk.

## Varnost

- **Magnetki:** uporabite magnetke, večje od 3,5 cm, vdelane v plastiko, brez majhnih delov, ki bi se lahko odlepili. Počenega zavrzite. Če otrok pogoltne več magnetov, se lahko v črevesju privlačijo: takoj k zdravniku.
- **Zdravila in nega:** zdravila daje odrasel in jih hrani zunaj otrokovega dosega. Korak na listu otroka le spomni, da je čas zanje.
- **Kopanje:** otroka nikoli ne pustite samega v kadi.

## Vam je pomagalo?

Kliknite **⭐ Star** na vrhu [strani projekta na GitHubu](https://github.com/stutek/child-routines) (potreben je brezplačen račun na GitHubu) ali povezavo delite z drugimi starši. Tako bomo vedeli, da je projekt vreden nadaljnjega dela.

## Za napredne

### Tisk brez povezave

1. Na [strani projekta](https://github.com/stutek/child-routines) kliknite **Code**, nato **Download ZIP**, in arhiv razširite. Listi potrebujejo mapo `images/` ob mapi `output/`, zato odpiranje posamezne datoteke na GitHubu ne deluje.
2. V Chromu odprite `web/index.html` za lasten list ali `output/sl-primer.html` za vzorec.
3. Natisnite kot zgoraj.

### Lastna rutina iz datotek

Rutine so podatkovne datoteke v [`routines/<jezik>/`](routines/). Eno kopirajte, spremenite napise, sličice in barve, nato znova zgradite:

```bash
pip install -r requirements.txt
python3 tools/check_images.py   # preveri slike in rutine
python3 tools/build.py          # zapiše output/<jezik>-<ime>.html
```

Slike so v [`images/`](images/), vsaka s svojo datoteko metapodatkov. Kako ustvariti nove: [docs/PROMPTS.sl.md](docs/PROMPTS.sl.md).

### Lastna rutina z agentom

Agent z umetno inteligenco (Claude Code, Codex, Gemini CLI ali Antigravity) lahko rutino sestavi namesto vas. Navodila repozitorija v [AGENTS.sl.md](AGENTS.sl.md) naloži sam.

1. Repozitorij prenesite na računalnik (`git clone https://github.com/stutek/child-routines.git` ali ZIP zgoraj) in agenta zaženite v njegovi mapi.
2. Rutino opišite s svojimi besedami, na primer:

   ```text
   V routines/sl/nasa.json sestavi rutino za mojega štiriletnega otroka: jutro (bujenje, stranišče, umivanje rok, zobki, oblačenje, vrtec) in večer (kopanje, pižama, zobki, pravljica, spanje). Kjer se ujemajo, uporabi obstoječe slike, znova zgradi in natisni v PDF, da ga pregledam.
   ```

3. Izid preverite sami v predogledu tiskanja v Chromu: vsak napis je cel, vrstni red je pravi, vsaka slika se ujema s svojim korakom.

Priporočila:

- **Osebni podatki ostanejo doma.** Otrokovo ime na lastnem listu je na vašem računalniku v redu; ne commitajte ga v javno kopijo (fork) ali zahtevo za združitev.
- **Najprej uporabite obstoječe slike.** Mnogi agenti za programiranje slik ne znajo ustvariti; za nove je potreben model za slike (te v repozitoriju so nastale z Google Gemini prek Antigravity), po [docs/PROMPTS.sl.md](docs/PROMPTS.sl.md) in [preverbi avtorstva](.agents/skills/copyright-check/SKILL.sl.md). Vsako novo sliko poglejte sami, preden jo natisnete ali delite.
- **Agent naj ne objavlja.** Spremembe preglejte, preden jih pushate ali odprete zahtevo za združitev.

### Prispevki

Starši lahko dodajo rutine, prevode in slike: glejte [CONTRIBUTING.sl.md](CONTRIBUTING.sl.md). Vsaka nova slika mora pred združitvijo prestati samodejna vrata za avtorske pravice.

## Licenca

Vsa vsebina (koda, slike, besedila rutin, dokumentacija) je dana v javno last po [CC0 1.0](LICENSE): smete jo kopirati, spreminjati in uporabljati za kateri koli namen, brez vprašanja in brez navedbe avtorja. Slike so ustvarjene z modelom za slike; take slike najverjetneje niso avtorsko zaščitene, CC0 pa to pove naravnost. CC0 ne velja za morebitne pravice tretjih oseb.

Za agente: [AGENTS.sl.md](AGENTS.sl.md).
